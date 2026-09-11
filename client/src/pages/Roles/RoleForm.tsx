import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, message } from "antd";
import api from '../../api/axios';

interface Permission {
  id: number;
  code: string;
  name: string;
}

interface Role {
  id: number;
  name: string;
  status: boolean;
  permissions?: Permission[];
}

interface RoleFormProps {
  open: boolean;
  editingRole: Role | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  permissionIds?: number[];
}

export default function RoleForm({ open, editingRole, onSuccess, onCancel }: RoleFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingRole) {
      form.setFieldsValue({
        name: editingRole.name,
        permissionIds: editingRole.permissions?.map((p) => p.id) ?? [],
      });
    } else {
      form.resetFields();
    }
  }, [open, editingRole, form]);

  useEffect(() => {
    if (!editingRole || !open) return;
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/permissions', { params: { limit: 100 } });
        setAllPermissions(response.data.data);
      } catch (err) {
        console.error('Failed to fetch permissions:', err);
      }
    };
    fetchPermissions();
  }, [editingRole, open]);

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, { name: values.name });
        await api.patch(`/roles/${editingRole.id}/permissions`, {
          permissionIds: values.permissionIds ?? [],
        });
        message.success('Role updated successfully!');
      } else {
        await api.post('/roles', { name: values.name, status: true });
        message.success('Role created successfully!');
      }
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error('Failed to save role:', err);
      message.error('Failed to save role. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingRole ? 'Edit Role' : 'Add New Role'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={editingRole ? 'Update' : 'Create'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Role name" name="name" rules={[{ required: true, message: 'Please enter a role name' }]}>
          <Input placeholder="Role name" />
        </Form.Item>

        {editingRole && (
          <Form.Item label="Permissions" name="permissionIds">
            <Select
              mode="multiple"
              placeholder="Select permissions"
              loading={allPermissions.length === 0}
              options={allPermissions.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}