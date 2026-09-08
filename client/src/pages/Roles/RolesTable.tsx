import { useState, useEffect } from "react";
import api from '../../api/axios';

interface Permission {
  id: number;
  code: string;
  name: string;
}

interface Role{
  id: number;
  name: string;
  status: boolean;
  permissions?: Permission[];
}

interface RolesTableProps{
  onEdit: (role: Role)=>void;
  refreshKey:number;
}

export default function RolesTable({ onEdit, refreshKey }:RolesTableProps){
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] =useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response =await api.get('/roles');
        setRoles(response.data);
      } catch (err){
        console.error('Failed to fetch roles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [refreshKey]);

  const handleDelete= async (id: number) => {
    const confirmed =window.confirm('Are you sure you want to delete this role?');
    if (!confirmed) return;

    try{
      await api.delete(`/roles/${id}`);
      setRoles(roles.filter((role) => role.id !== id));
    }catch (err) {
      console.error('Failed to delete role:', err);
      alert('Failed to delete role.');
    }
  };

  const handleToggleStatus = async (role:Role)=>{
    try {
      const response =await api.patch(`/roles/${role.id}`, {
        status:!role.status,
      });
      setRoles(roles.map((r)=>(r.id === role.id?response.data : r)));
    }catch (err){
      console.error('Failed to update status:',err);
      alert('Failed to update role status.');
    }
  };

  if (loading) {
    return <p>Loading roles...</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Name</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Status</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Permissions</th>
          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {roles.map((role) => (
          <tr key={role.id}>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{role.name}</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={role.status}
                  onChange={() => handleToggleStatus(role)}
                  style={{ marginRight: '8px' }}
                />
                {role.status ? 'Active' : 'Inactive'}
              </label>
            </td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
              {role.permissions && role.permissions.length > 0
                ? role.permissions.map((p) => p.code).join(', ')
                : <span style={{ color: '#999' }}>No permissions</span>}
            </td>
            <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <button style={{ marginRight: '8px' }} onClick={() => onEdit(role)}>Edit</button>
              <button onClick={() => handleDelete(role.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}