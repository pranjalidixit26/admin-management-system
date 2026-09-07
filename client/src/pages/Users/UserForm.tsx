import { useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
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

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPassword('');
    }
  }, [editingUser]);

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
        await axios.patch(`http://localhost:3000/users/${editingUser.id}`, updateData);
        setSuccess('User updated successfully!');
      } else {
        await axios.post('http://localhost:3000/users', { name, email, password });
        setSuccess('User created successfully!');
      }
      setName('');
      setEmail('');
      setPassword('');
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

      <button type="submit">{editingUser ? 'Update User' : 'Create User'}</button>
      {editingUser && (
        <button type="button" onClick={onCancel} style={{ marginLeft: '8px' }}>
          Cancel
        </button>
      )}
    </form>
  );
}