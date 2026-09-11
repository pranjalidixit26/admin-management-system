import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import api from '../../api/axios';

interface Category {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
}

interface CategoryFormProps {
  open: boolean;
  editingCategory: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ open, editingCategory, onSuccess, onCancel }: CategoryFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingCategory) {
      form.setFieldsValue(editingCategory);
    } else {
      form.resetFields();
    }
  }, [editingCategory, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, values);
      } else {
        await api.post('/categories', values);
      }
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      title={editingCategory ? 'Edit Category' : 'Create Category'}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText={editingCategory ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a category name' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        {editingCategory && (
          <Form.Item name="status" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}