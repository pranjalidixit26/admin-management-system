import { useState } from "react";
import { Button } from "antd";
import RoleForm from './RoleForm';
import RolesTable from './RolesTable';
import { hasPermission } from "../../utils/permissions";

interface Permission {
  id: number;
  code: string;
  name: string;
}

interface Role {
  id: number;
  name: string;
  status: boolean;
  permissions?: Permission[];
}

export default function RolesPage() {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreateForm = () => {
    setEditingRole(null);
    setIsFormOpen(true);
  };

  const openEditForm = (role: Role) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRole(null);
  };

  const handleSuccess = () => {
    closeForm();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Roles</h1>
        {hasPermission('ROLE_CREATE') && (
          <Button type="primary" onClick={openCreateForm}>Add New Role</Button>
        )}
      </div>

      <RolesTable key={refreshKey} refreshKey={refreshKey} onEdit={openEditForm} />

      <RoleForm open={isFormOpen} editingRole={editingRole} onSuccess={handleSuccess} onCancel={closeForm} />
    </div>
  );
}