import { useState } from "react";
import PermissionForm from './PermissionForm';
import PermissionsTable from './PermissionsTable';

interface Permission {
  id:number;
  code:string;
  name: string;
}

export default function PermissionsPage(){
  const [editingPermission, setEditingPermission] =useState<Permission | null>(null);
  const [refreshKey,setRefreshKey]= useState(0);

  const handleSuccess =()=> {
    setEditingPermission(null);
    setRefreshKey((prev) =>prev + 1);
  };

  return(
    <div>
      <h1>Permissions</h1>
      <PermissionForm
        editingPermission={editingPermission}
        onSuccess={handleSuccess}
        onCancel={() => setEditingPermission(null)}
      />
      <PermissionsTable onEdit={setEditingPermission} refreshKey={refreshKey}/>
    </div>
  );
}