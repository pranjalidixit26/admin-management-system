import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch } from 'antd';
import api from '../../api/axios';

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  subcategories?: Category[];
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
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingCategories(true);
      api
        .get('/categories/tree')
        .then((res) => setCategories(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingCategories(false));
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

  // Categories with subcategories render as a group (parent as header, plus a
  // "general" option to assign the parent itself, then each subcategory).
  // Categories with no subcategories render as a single flat, selectable option.
  const categoryOptions = categories.map((cat) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      return {
        label: cat.name,
        title: cat.name,
        options: [
          { label: `${cat.name} (general)`, value: cat.id },
          ...cat.subcategories.map((sub) => ({ label: sub.name, value: sub.id })),
        ],
      };
    }
    return { label: cat.name, value: cat.id };
  });

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
            options={categoryOptions}
            loading={loadingCategories}
            placeholder="Select a category"
            showSearch
            optionFilterProp="label"
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