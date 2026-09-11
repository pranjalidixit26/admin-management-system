import { useEffect, useState } from 'react';
import { Modal, Form, Input, Switch, Select, message } from 'antd';
import api from '../../api/axios';

interface Category {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
  parentId?: number | null;
  subcategories?: Category[];
}

interface CategoryFormProps {
  open: boolean;
  editingCategory: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ open, editingCategory, onSuccess, onCancel }: CategoryFormProps) {
  const [form] = Form.useForm();
  const [parentOptions, setParentOptions] = useState<Category[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  const hasSubcategories = !!(editingCategory?.subcategories && editingCategory.subcategories.length > 0);

  useEffect(() => {
    if (!open) return;

    const fetchParentOptions = async () => {
      setLoadingParents(true);
      try {
        const res = await api.get('/categories/tree');
        const topLevel: Category[] = res.data;
        // A category can't be its own parent
        setParentOptions(topLevel.filter((c) => c.id !== editingCategory?.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingParents(false);
      }
    };

    fetchParentOptions();
  }, [open, editingCategory]);

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
      // Explicitly send null (not omit the key) so clearing the parent
      // on an existing subcategory actually turns it back into top-level.
      const payload = { ...values, parentId: values.parentId ?? null };

      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        console.error(err);
      }
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
        <Form.Item
          name="parentId"
          label="Parent Category"
          extra={
            hasSubcategories
              ? 'This category has subcategories, so it cannot be made a subcategory itself.'
              : 'Leave empty to create a top-level category.'
          }
        >
          <Select
            allowClear
            placeholder="None (top-level category)"
            loading={loadingParents}
            disabled={hasSubcategories}
            options={parentOptions.map((c) => ({ label: c.name, value: c.id }))}
          />
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