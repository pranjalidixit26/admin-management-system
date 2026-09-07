import { useState, useEffect } from "react";
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
}

interface UsersTableProps {
  onEdit: (user: User) => void;
}

export default function UsersTable({ onEdit }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:3000/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (err) {
      console.error('Failed to delete users:', err);
      alert('Failed to delete user.');
    }
  };

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Name</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Email</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Status</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{user.name}</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{user.email}</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
              {user.status ? 'Active' : 'Inactive'}
            </td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <button style={{ marginRight: '8px' }} onClick={() => onEdit(user)}>Edit</button>
              <button onClick={() => handleDelete(user.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}