import { useState } from "react";
import RoleForm from './RoleForm';
import RolesTable from './RolesTable';

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

export default function RolesPage(){
  const [editingRole,setEditingRole] =useState<Role|null>(null);
  const [refreshKey, setRefreshKey]=useState(0);

  const handleSuccess=()=>{
    setEditingRole(null);
    setRefreshKey((prev)=> prev + 1);
  };

  return(
    <div>
      <h1>Roles</h1>
      <RoleForm
        editingRole={editingRole}
        onSuccess={handleSuccess}
        onCancel={() => setEditingRole(null)}
      />
      <RolesTable onEdit={setEditingRole} refreshKey={refreshKey} />
    </div>
  );
}