import { useState, useEffect } from "react";
import api from '../../api/axios';
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

interface RoleFormProps{
  editingRole: Role | null;
  onSuccess: ()=>void;
  onCancel: () =>void;
}

export default function RoleForm({ editingRole, onSuccess, onCancel }: RoleFormProps) {
  const [name, setName]=useState('');
  const [error, setError]= useState('');

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  useEffect(()=>{
    if (editingRole){
      setName(editingRole.name);
      setSelectedPermissionIds(editingRole.permissions?.map((p) => p.id) ?? []);
    } else {
      setName('');
      setSelectedPermissionIds([]);
    }
  },[editingRole]);

  useEffect(() => {
    if (!editingRole) return;
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/permissions', { params: { limit: 100 } });
        setAllPermissions(response.data.data);
      } catch (err) {
        console.error('Failed to fetch permissions:', err);
      }
    };
    fetchPermissions();
  }, [editingRole]);

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault();
    setError('');

    try {
      if (editingRole){
        await api.patch(`/roles/${editingRole.id}`, { name });
        await api.patch(`/roles/${editingRole.id}/permissions`, { permissionIds: selectedPermissionIds });
      }else {
        await api.post('/roles', { name, status: true });
      }
      setName('');
      setSelectedPermissionIds([]);
      onSuccess();
    } catch (err) {
      console.error('Failed to save role:', err);
      setError('Failed to save role. Please try again.');
    }
  };

  return(
    <form onSubmit={handleSubmit} style={{marginBottom: '20px'}}>
      <input
        type="text"
        placeholder="Role name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{marginRight:'8px',padding:'6px' }}
      />
      <Button type="submit">{editingRole?'Update':'Create'}</Button>
        {editingRole &&(
        <Button type="button" variant="secondary" onClick={onCancel} style={{marginLeft:'8px'}}>
            Cancel
        </Button>
        )}

      {editingRole && (
        <div style={{ marginTop: '12px' }}>
          <label>Permissions</label>
          <br />
          {allPermissions.length === 0 && <p style={{ color: '#999' }}>Loading permissions...</p>}
          {allPermissions.map((permission) => (
            <label key={permission.id} style={{ display: 'block', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={selectedPermissionIds.includes(permission.id)}
                onChange={() => handlePermissionToggle(permission.id)}
                style={{ marginRight: '8px' }}
              />
              {permission.code} — {permission.name}
            </label>
          ))}
        </div>
      )}

      {error&&<p style={{color:'red'}}>{error}</p>}
    </form>
  );
}