import { useState, useEffect } from "react";
import axios from '../../api/axios';

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

interface UserFormProps {
  editingUser: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserForm({ editingUser, onSuccess, onCancel }: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
      setPassword('');
      setSelectedRoleIds(editingUser.roles?.map((r) => r.id) ?? []);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setSelectedRoleIds([]);
    }
  }, [editingUser]);

  useEffect(() => {
    if (!editingUser) return;
    const fetchRoles = async () => {
      try {
        const response = await axios.get('/roles');
        setAllRoles(response.data);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, [editingUser]);

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        const updateData: { name: string; email: string; password?: string } = { name, email };
        if (password) {
          updateData.password = password;
        }
        await axios.patch(`/users/${editingUser.id}`, updateData);
        await axios.patch(`/users/${editingUser.id}/roles`, { roleIds: selectedRoleIds });
        setSuccess('User updated successfully!');
      } else {
        await axios.post('/users', { name, email, password });
        setSuccess('User created successfully!');
      }
      setName('');
      setEmail('');
      setPassword('');
      setSelectedRoleIds([]);
      onSuccess();
    } catch (err) {
      setError(editingUser ? 'Failed to update user.' : 'Failed to create user.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ marginBottom: '12px' }}>
        <label>Name</label>
        <br />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>Email</label>
        <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>Password {editingUser && '(leave blank to keep unchanged)'}</label>
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      {editingUser && (
        <div style={{ marginBottom: '12px' }}>
          <label>Roles</label>
          <br />
          {allRoles.length === 0 && <p style={{ color: '#999' }}>Loading roles...</p>}
          {allRoles.map((role) => (
            <label key={role.id} style={{ display: 'block', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => handleRoleToggle(role.id)}
                style={{ marginRight: '8px' }}
              />
              {role.name}
            </label>
          ))}
        </div>
      )}

      <button type="submit">{editingUser ? 'Update User' : 'Create User'}</button>
      {editingUser && (
        <button type="button" onClick={onCancel} style={{ marginLeft: '8px' }}>
          Cancel
        </button>
      )}
    </form>
  );
}