import { useState } from "react";
import { Button, Card, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PermissionForm from './PermissionForm';
import PermissionsTable from './PermissionsTable';
import { hasPermission } from "../../utils/permissions";

const { Title, Text } = Typography;

interface Permission {
  id: number;
  code: string;
  name: string;
}

export default function PermissionsPage() {
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreateForm = () => {
    setEditingPermission(null);
    setIsFormOpen(true);
  };

  const openEditForm = (permission: Permission) => {
    setEditingPermission(permission);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPermission(null);
  };

  const handleSuccess = () => {
    closeForm();
    setRefreshKey((prev) => prev + 1);
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
              Permissions
            </Title>
            <Text type="secondary">Fine-grained actions that can be granted to roles.</Text>
          </div>
          {hasPermission('PERMISSION_CREATE') && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreateForm}>
              Add New Permission
            </Button>
          )}
        </div>

        <PermissionsTable key={refreshKey} refreshKey={refreshKey} onEdit={openEditForm} />
      </Card>

      <PermissionForm
        open={isFormOpen}
        editingPermission={editingPermission}
        onSuccess={handleSuccess}
        onCancel={closeForm}
      />
    </div>
  );
}