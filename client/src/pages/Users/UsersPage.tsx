import { useState } from "react";
import { Button } from "antd";
import UsersTable from "./UsersTable";
import UserForm from "./UserForm";
import { hasPermission } from "../../utils/permissions";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
  roles?: Role[];
}

export default function UsersPage() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreateForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    closeForm();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Users</h1>
        {hasPermission('USER_CREATE') && (
          <Button type="primary" onClick={openCreateForm}>Add New User</Button>
        )}
      </div>

      <UsersTable key={refreshKey} refreshKey={refreshKey} onEdit={openEditForm} />

      <UserForm open={isFormOpen} editingUser={editingUser} onSuccess={handleSuccess} onCancel={closeForm} />
    </div>
  );
}