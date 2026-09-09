import { useState, useEffect } from "react";
import api from '../../api/axios';
import { hasPermission } from "../../utils/permissions";

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
  const [loading, setLoading] =useState(true);
  const showActions = hasPermission('PERMISSION_EDIT') || hasPermission('PERMISSION_DELETE');

  useEffect(()=>{
    const fetchPermissions=async ()=>{
      try{
        const response =await api.get('/permissions');
        setPermissions(response.data);
      } catch(err) {
        console.error('Failed to fetch permissions:', err);
      }finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  },[refreshKey]);

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

  if(loading){
    return <p>Loading permissions...</p>;
  }

  return(
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
        {permissions.map((permission) => (
          <tr key={permission.id}>
            <td style={{padding:'10px',borderBottom:'1px solid #e2e8f0'}}>{permission.code}</td>
            <td style={{ padding:'10px',borderBottom:'1px solid #e2e8f0'}}>{permission.name}</td>
            {showActions && (
            <td style={{padding: '10px', borderBottom:'1px solid #e2e8f0' }}>
                {hasPermission('PERMISSION_EDIT') && (
                <button style={{marginRight:'8px' }} onClick={() =>onEdit(permission)}>Edit</button>
                )}
                {hasPermission('PERMISSION_DELETE') && (
                <button onClick={()=>handleDelete(permission.id)}>Delete</button>
                )}
            </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}