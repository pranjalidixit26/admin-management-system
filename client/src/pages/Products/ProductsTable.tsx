import { useState, useEffect } from 'react';
import { Input, Popconfirm, message, Tag, Typography, Row, Col, Card, Empty, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { hasPermission } from '../../utils/permissions';

const { Text, Paragraph } = Typography;

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: Category;
  status: boolean;
}

interface ProductsTableProps {
  refreshKey: number;
  onEdit: (product: Product) => void;
}

const LOW_STOCK_THRESHOLD = 5;

export default function ProductsTable({ refreshKey, onEdit }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 8;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { page, limit, search },
      });
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshKey, page, search]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('Product deleted');
      fetchProducts();
    } catch (err) {
      console.error(err);
      message.error('Failed to delete product');
    }
  };

  const showActions = hasPermission('PRODUCT_EDIT') || hasPermission('PRODUCT_DELETE');

  return (
    <div>
      <Input.Search
        placeholder="Search products"
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        style={{ marginBottom: 20, maxWidth: 300 }}
        allowClear
      />

      <Spin spinning={loading}>
        {products.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? `No products found for "${search}"` : 'No products yet'}
            style={{ padding: '48px 0' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  styles={{ body: { padding: 16 } }}
                  cover={
                    <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f5f5f5' }}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <PictureOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                        </div>
                      )}

                      {/* Hover overlay actions */}
                      {showActions && (
                        <div
                          className="product-card-overlay"
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            gap: 6,
                            opacity: 0,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          {hasPermission('PRODUCT_EDIT') && (
                            <button
                              onClick={() => onEdit(product)}
                              style={overlayButtonStyle}
                              aria-label="Edit product"
                            >
                              <EditOutlined />
                            </button>
                          )}
                          {hasPermission('PRODUCT_DELETE') && (
                            <Popconfirm
                              title="Delete this product?"
                              description="This action cannot be undone."
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                              cancelText="No"
                              onConfirm={() => handleDelete(product.id)}
                            >
                              <button
                                style={{ ...overlayButtonStyle, color: '#ff4d4f' }}
                                aria-label="Delete product"
                              >
                                <DeleteOutlined />
                              </button>
                            </Popconfirm>
                          )}
                        </div>
                      )}

                      {/* Stock / status badges */}
                      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
                        {!product.status && (
                          <Tag color="red" style={{ borderRadius: 12, margin: 0 }}>
                            Inactive
                          </Tag>
                        )}
                        {product.stock === 0 ? (
                          <Tag color="red" style={{ borderRadius: 12, margin: 0 }}>
                            Out of stock
                          </Tag>
                        ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                          <Tag color="orange" style={{ borderRadius: 12, margin: 0 }}>
                            Low stock
                          </Tag>
                        ) : null}
                      </div>
                    </div>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 15 }}>
                      {product.name}
                    </Text>
                    <Tag style={{ borderRadius: 10, margin: 0 }}>{product.category?.name ?? '-'}</Tag>
                  </div>

                  {product.description && (
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      type="secondary"
                      style={{ fontSize: 13, marginBottom: 8 }}
                    >
                      {product.description}
                    </Paragraph>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text strong style={{ fontSize: 16, color: '#1f2937' }}>
                      ₹{Number(product.price).toFixed(2)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Stock: {product.stock}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* Simple pagination controls */}
      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, gap: 8 }}>
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: p === page ? '1px solid #6366f1' : '1px solid #e5e7eb',
                background: p === page ? '#6366f1' : '#fff',
                color: p === page ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .ant-card:hover .product-card-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

const overlayButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,0.95)',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
};