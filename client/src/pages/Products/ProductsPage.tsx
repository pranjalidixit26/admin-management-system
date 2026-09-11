import { useState } from 'react';
import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProductForm from './ProductForm';
import ProductsTable from './ProductsTable';
import { hasPermission } from '../../utils/permissions';

const { Title, Text } = Typography;

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

export default function ProductsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setFormOpen(false);
    setEditingProduct(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: 28 } }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Products
            </Title>
            <Text type="secondary">Track inventory, pricing, and status in one shared view.</Text>
          </div>
          {hasPermission('PRODUCT_CREATE') && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
              Create Product
            </Button>
          )}
        </div>

        <ProductsTable refreshKey={refreshKey} onEdit={handleEdit} />
      </Card>

      <ProductForm
        open={formOpen}
        editingProduct={editingProduct}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}