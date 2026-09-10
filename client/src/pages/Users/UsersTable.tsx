import { useState, useEffect } from "react";
import api from '../../api/axios';
import { hasPermission } from "../../utils/permissions";
import Button from '../../components/Button';

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

interface UsersTableProps {
  onEdit: (user: User) => void;
  refreshKey: number;
}

export default function UsersTable({ onEdit, refreshKey }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const showActions = hasPermission('USER_EDIT') || hasPermission('USER_DELETE');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users', {
          params: { page, limit: 5, search: search || undefined },
        });
        setUsers(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshKey, page, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (err) {
      console.error('Failed to delete users:', err);
      alert('Failed to delete user.');
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        style={{ marginBottom: '12px', padding: '8px', width: '250px' }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Roles</th>
            {showActions && (
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={showActions ? 5 : 4} style={{ padding: '10px', textAlign: 'center' }}>
                Loading...
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{user.name}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{user.email}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  {user.status ? 'Active' : 'Inactive'}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                  {user.roles && user.roles.length > 0
                    ? user.roles.map((r) => r.name).join(', ')
                    : <span style={{ color: '#999' }}>No roles</span>}
                </td>
                {showActions && (
                <td style={{padding:'10px',borderBottom:'1px solid #e2e8f0'}}>
                    {hasPermission('USER_EDIT')&&(
                        <Button variant="secondary" style={{marginRight:'8px'}} onClick={()=>onEdit(user)}>Edit</Button>
                    )}
                    {hasPermission('USER_DELETE')&&(
                        <Button variant="danger" onClick={()=>handleDelete(user.id)}>Delete</Button>
                    )}
                </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}