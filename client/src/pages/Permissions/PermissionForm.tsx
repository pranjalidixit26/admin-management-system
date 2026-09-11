import { useEffect, useState } from "react";
import { Modal, Form, Input, message } from "antd";
import api from '../../api/axios';

interface Permission {
  id: number;
  code: string;
  name: string;
}

interface PermissionFormProps {
  open: boolean;
  editingPermission: Permission | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormValues {
  code: string;
  name: string;
}

export default function PermissionForm({ open, editingPermission, onSuccess, onCancel }: PermissionFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingPermission) {
      form.setFieldsValue({
        code: editingPermission.code,
        name: editingPermission.name,
      });
    } else {
      form.resetFields();
    }
  }, [open, editingPermission, form]);

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editingPermission) {
        await api.patch(`/permissions/${editingPermission.id}`, values);
        message.success('Permission updated successfully!');
      } else {
        await api.post('/permissions', values);
        message.success('Permission created successfully!');
      }
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error('Failed to save permission:', err);
      message.error('Failed to save permission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingPermission ? 'Edit Permission' : 'Add New Permission'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText={editingPermission ? 'Update' : 'Create'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Code"
          name="code"
          rules={[{ required: true, message: 'Please enter a code' }]}
          normalize={(value: string) => value?.toUpperCase()}
        >
          <Input placeholder="e.g. USER_CREATE" />
        </Form.Item>

        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="e.g. Create User" />
        </Form.Item>
      </Form>
    </Modal>
  );
}