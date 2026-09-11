import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, message } from "antd";
import axios from '../../api/axios';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
  roles?: Role[];
}

interface UserFormProps {
  open: boolean;
  editingUser: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormValues {
  name: string;
  email: string;
  password?: string;
  roleIds?: number[];
}

export default function UserForm({ open, editingUser, onSuccess, onCancel }: UserFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingUser) {
      form.setFieldsValue({
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        roleIds: editingUser.roles?.map((r) => r.id) ?? [],
      });
    } else {
      form.resetFields();
    }
  }, [open, editingUser, form]);

  useEffect(() => {
    if (!editingUser || !open) return;
    const fetchRoles = async () => {
      try {
        const response = await axios.get('/roles', { params: { limit: 100 } });
        setAllRoles(response.data.data);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, [editingUser, open]);

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        const updateData: { name: string; email: string; password?: string } = {
          name: values.name,
          email: values.email,
        };
        if (values.password) updateData.password = values.password;
        await axios.patch(`/users/${editingUser.id}`, updateData);
        await axios.patch(`/users/${editingUser.id}/roles`, { roleIds: values.roleIds ?? [] });
        message.success('User updated successfully!');
      } else {
        await axios.post('/users', {
          name: values.name,
          email: values.email,
          password: values.password,
        });
        message.success('User created successfully!');
      }
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error('Failed to save user:', err);
      message.error(editingUser ? 'Failed to update user.' : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingUser ? 'Edit User' : 'Add New User'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={editingUser ? 'Update User' : 'Create User'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a name' }]}>
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter an email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={editingUser ? 'Password (leave blank to keep unchanged)' : 'Password'}
          name="password"
          rules={editingUser ? [] : [{ required: true, message: 'Please enter a password' }]}
        >
          <Input.Password />
        </Form.Item>

        {editingUser && (
          <Form.Item label="Roles" name="roleIds">
            <Select
              mode="multiple"
              placeholder="Select roles"
              loading={allRoles.length === 0}
              options={allRoles.map((role) => ({ label: role.name, value: role.id }))}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}