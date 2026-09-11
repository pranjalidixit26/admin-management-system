import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch } from 'antd';
import api from '../../api/axios';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: Category;
  status: boolean;
}

interface ProductFormProps {
  open: boolean;
  editingProduct: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ open, editingProduct, onSuccess, onCancel }: ProductFormProps) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (open) {
      api.get('/categories', { params: { limit: 100 } }).then((res) => {
        setCategories(res.data.data);
      });
    }
  }, [open]);

  useEffect(() => {
    if (editingProduct) {
      form.setFieldsValue({
        ...editingProduct,
        categoryId: editingProduct.category?.id,
      });
    } else {
      form.resetFields();
    }
  }, [editingProduct, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, values);
      } else {
        await api.post('/products', values);
      }
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      title={editingProduct ? 'Edit Product' : 'Create Product'}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText={editingProduct ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a product name' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please enter a price' }]}>
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="stock" label="Stock">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="imageUrl" label="Image URL">
          <Input />
        </Form.Item>
        <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Please select a category' }]}>
          <Select
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select a category"
          />
        </Form.Item>
        {editingProduct && (
          <Form.Item name="status" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}