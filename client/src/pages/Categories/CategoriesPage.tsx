import { useState } from 'react';
import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CategoryForm from './CategoryForm';
import CategoriesTable from './CategoriesTable';
import { hasPermission } from '../../utils/permissions';

const { Title, Text } = Typography;

interface Category {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  parentId?: number | null;
  subcategories?: Category[];
}

export default function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setFormOpen(false);
    setEditingCategory(null);
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
              Categories
            </Title>
            <Text type="secondary">Organize your product catalog into clear, searchable groups.</Text>
          </div>
          {hasPermission('CATEGORY_CREATE') && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
              Create Category
            </Button>
          )}
        </div>

        <CategoriesTable refreshKey={refreshKey} onEdit={handleEdit} />
      </Card>

      <CategoryForm
        open={formOpen}
        editingCategory={editingCategory}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}