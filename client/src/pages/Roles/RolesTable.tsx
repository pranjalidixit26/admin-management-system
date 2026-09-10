import { useState, useEffect } from "react";
import api from '../../api/axios';
import { hasPermission } from "../../utils/permissions";
import Button from '../../components/Button';

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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const showActions=hasPermission('ROLE_EDIT')||hasPermission('ROLE_DELETE');

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await api.get('/roles', {
          params: { page, limit: 5, search: search || undefined },
        });
        setRoles(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch (err){
        console.error('Failed to fetch roles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [refreshKey, page, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Permissions</th>
            {showActions && (
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
             )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={showActions ? 4 : 3} style={{ padding: '10px', textAlign: 'center' }}>
                Loading...
              </td>
            </tr>
          ) : (
            roles.map((role) => (
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
                {showActions && (
                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                    {hasPermission('ROLE_EDIT') && (
                    <Button variant="secondary" style={{ marginRight: '8px' }} onClick={() => onEdit(role)}>Edit</Button>
                    )}
                    {hasPermission('ROLE_DELETE') && (
                    <Button variant="danger" onClick={() => handleDelete(role.id)}>Delete</Button>
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