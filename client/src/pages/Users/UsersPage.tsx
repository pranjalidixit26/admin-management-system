import UsersTable from './UsersTable';
import UserForm from './UserForm';

export default function UsersPage() {
  return (
    <div>
      <h1>Users</h1>

      <div style={{ marginBottom: '30px' }}>
        <h3>Add New User</h3>
        <UserForm />
      </div>

      <h3>Existing Users</h3>
      <UsersTable />
    </div>
  );
}