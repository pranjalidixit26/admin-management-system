import { useState } from "react";
import UsersTable from "./UsersTable";
import UserForm from "./UserForm";

interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
}

export default function UsersPage() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setEditingUser(null);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <h1>Users</h1>
      <div style={{ marginBottom: '30px' }}>
        <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
        <UserForm
          editingUser={editingUser}
          onSuccess={handleSuccess}
          onCancel={() => setEditingUser(null)}
        />
      </div>

      <h3>Existing Users</h3>
      <UsersTable key={refreshKey} onEdit={setEditingUser} />
    </div>
  );
}