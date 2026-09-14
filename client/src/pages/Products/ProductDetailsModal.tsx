import { Modal, Spin, Empty, Tag, Typography, Divider } from 'antd';

const { Text } = Typography;

interface ProductDetailsModalProps {
  visible: boolean;
  loading: boolean;
  product: any; // full product from GET /products/:id, includes variants[].images[]
  onClose: () => void;
}

export default function ProductDetailsModal({ visible, loading, product, onClose }: ProductDetailsModalProps) {
  const variants = product?.variants ?? [];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={product ? product.name : 'Product details'}
      width={640}
    >
      <Spin spinning={loading}>
        {!product ? (
          <div style={{ minHeight: 120 }} />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <Tag>{product.category?.name ?? '-'}</Tag>
              {!product.status && <Tag color="red">Inactive</Tag>}
            </div>
            {product.description && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                {product.description}
              </Text>
            )}

            <Divider plain style={{ marginTop: 20, textAlign: 'left' }}>
                Variants ({variants.length})
            </Divider>

            {variants.length === 0 ? (
              <Empty description="No variants" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {variants.map((variant: any) => (
                  <div
                    key={variant.id}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 10,
                      padding: 12,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Thumbnails */}
                    {variant.images && variant.images.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {variant.images.slice(0, 2).map((img: any) => (
                          <img
                            key={img.id}
                            src={img.imageUrl}
                            alt=""
                            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          flexShrink: 0,
                          borderRadius: 6,
                          background: '#f5f5f5',
                        }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{variant.sku}</Text>
                        <Text strong>
                          ₹{Number(variant.price ?? product.price).toFixed(2)}
                        </Text>
                      </div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {variant.color && <Tag>{variant.color}</Tag>}
                        {variant.size && <Tag>{variant.size}</Tag>}
                        <Tag color={variant.stock === 0 ? 'red' : variant.stock <= 5 ? 'orange' : 'default'}>
                          Stock: {variant.stock}
                        </Tag>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Spin>
    </Modal>
  );
}