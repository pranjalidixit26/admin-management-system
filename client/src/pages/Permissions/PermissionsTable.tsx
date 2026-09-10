import { useState, useEffect } from "react";
import api from '../../api/axios';
import { hasPermission } from "../../utils/permissions";
import Button from '../../components/Button';

interface Permission{
  id:number;
  code:string;
  name:string;
}

interface PermissionsTableProps{
  onEdit:(permission: Permission)=>void;
  refreshKey:number;
}

export default function PermissionsTable({onEdit, refreshKey }:PermissionsTableProps) {
  const [permissions,setPermissions]=useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const showActions = hasPermission('PERMISSION_EDIT') || hasPermission('PERMISSION_DELETE');

  useEffect(()=>{
    const fetchPermissions=async ()=>{
      setLoading(true);
      try{
        const response = await api.get('/permissions', {
          params: { page, limit: 5, search: search || undefined },
        });
        setPermissions(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch(err) {
        console.error('Failed to fetch permissions:', err);
      }finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  },[refreshKey, page, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete =async (id:number)=>{
    const confirmed= window.confirm('Are you sure you want to delete this permission?');
    if (!confirmed) return;

    try{
      await api.delete(`/permissions/${id}`);
      setPermissions(permissions.filter((p) => p.id !== id));
    }catch(err) {
      console.error('Failed to delete permission:', err);
      alert('Failed to delete permission.');
    }
  };

  return(
    <div>
      <input
        type="text"
        placeholder="Search by code..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        style={{ marginBottom: '12px', padding: '8px', width: '250px' }}
      />
      <table style={{width:'100%',borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left',padding:'10px',borderBottom:'2px solid #e2e8f0'}}>Code</th>
            <th style={{textAlign:'left',padding:'10px',borderBottom:'2px solid #e2e8f0'}}>Name</th>
            {showActions && (
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
             )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={showActions ? 3 : 2} style={{ padding: '10px', textAlign: 'center' }}>
                Loading...
              </td>
            </tr>
          ) : (
            permissions.map((permission) => (
              <tr key={permission.id}>
                <td style={{padding:'10px',borderBottom:'1px solid #e2e8f0'}}>{permission.code}</td>
                <td style={{ padding:'10px',borderBottom:'1px solid #e2e8f0'}}>{permission.name}</td>
                {showActions && (
                <td style={{padding: '10px', borderBottom:'1px solid #e2e8f0' }}>
                    {hasPermission('PERMISSION_EDIT') && (
                    <Button variant="secondary" style={{marginRight:'8px' }} onClick={() =>onEdit(permission)}>Edit</Button>
                    )}
                    {hasPermission('PERMISSION_DELETE') && (
                    <Button variant="danger" onClick={()=>handleDelete(permission.id)}>Delete</Button>
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