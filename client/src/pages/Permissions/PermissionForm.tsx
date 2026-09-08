import { useState, useEffect } from "react";
import api from '../../api/axios';

interface Permission {
  id:number;
  code: string;
  name:string;
}

interface PermissionFormProps{
  editingPermission: Permission|null;
  onSuccess: () =>void;
  onCancel: ()=>void;
}

export default function PermissionForm({editingPermission,onSuccess,onCancel}:PermissionFormProps) {
  const [code,setCode] =useState('');
  const [name, setName]= useState('');
  const [error,setError]= useState('');

  useEffect(()=>{
    if(editingPermission){
      setCode(editingPermission.code);
      setName(editingPermission.name);
    }else {
      setCode('');
      setName('');
    }
  },[editingPermission]);

  const handleSubmit =async (e:React.FormEvent)=>{
    e.preventDefault();
    setError('');

    try{
      if(editingPermission){
        await api.patch(`/permissions/${editingPermission.id}`,{code,name });
      } else{
        await api.post('/permissions', { code,name});
      }
      setCode('');
      setName('');
      onSuccess();
    } catch(err){
      console.error('Failed to save permission:',err);
      setError('Failed to save permission. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{marginBottom:'20px' }}>
      <input
        type="text"
        placeholder="Code (e.g. USER_CREATE)"
        value={code}
        onChange={(e)=>setCode(e.target.value.toUpperCase())}
        required
        style={{marginRight:'8px',padding:'6px'}}
      />
      <input
        type="text"
        placeholder= "Name (e.g. Create User)"
        value={name}
        onChange={(e)=> setName(e.target.value)}
        required
        style={{marginRight:'8px',padding:'6px' }}
      />
      <button type="submit">{editingPermission?'Update': 'Create'}</button>
      {editingPermission && (
        <button type="button" onClick={onCancel} style={{ marginLeft: '8px' }}>
          Cancel
        </button>
      )}
      {error &&<p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}