import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Button, Card, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  subcategories?: Category[];
}

interface VariantImage {
  imageUrl: string;
  sortOrder?: number;
}

interface Variant {
  id?: number;
  color?: string | null;
  size?: string | null;
  stock?: number;
  price?: number | null;
  images?: VariantImage[];
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
  variants?: Variant[];
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
        variants: (editingProduct.variants ?? []).map((v) => ({
          color: v.color ?? undefined,
          size: v.size ?? undefined,
          stock: v.stock ?? 0,
          price: v.price ?? undefined,
          images: (v.images ?? []).map((img) => ({ imageUrl: img.imageUrl })),
        })),
      });
    } else {
      form.resetFields();
    }
  }, [editingProduct, form]);

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

      const variants = (values.variants ?? []).map((v: any) => ({
        color: v.color || undefined,
        size: v.size || undefined,
        stock: v.stock ?? 0,
        price: v.price ?? undefined,
        images: (v.images ?? [])
          .filter((img: any) => img?.imageUrl)
          .map((img: any, idx: number) => ({ imageUrl: img.imageUrl, sortOrder: idx })),
      }));

      const payload = { ...values, variants };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
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
      width={700}
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

        <Divider orientationMargin={0} titlePlacement="left">Variants</Divider>

        <Form.List name="variants">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: 16 }}
                  title={`Variant ${name + 1}`}
                  extra={
                    <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  }
                >
                  <Space style={{ display: 'flex' }} align="baseline" wrap>
                    <Form.Item {...restField} name={[name, 'color']} label="Color">
                      <Input placeholder="e.g. Red" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'size']} label="Size">
                      <Input placeholder="e.g. M" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'stock']} label="Stock">
                      <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'price']} label="Price (optional override)">
                      <InputNumber min={0} step={0.01} />
                    </Form.Item>
                  </Space>

                  <Form.List name={[name, 'images']}>
                    {(imgFields, { add: addImg, remove: removeImg }) => (
                      <>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>Images</div>
                        {imgFields.map(({ key: imgKey, name: imgName, ...imgRestField }) => (
                          <Space key={imgKey} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                            <Form.Item
                              {...imgRestField}
                              name={[imgName, 'imageUrl']}
                              style={{ marginBottom: 0, width: 400 }}
                            >
                              <Input placeholder="Image URL" />
                            </Form.Item>
                            <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeImg(imgName)} />
                          </Space>
                        ))}
                        <Button type="dashed" onClick={() => addImg()} icon={<PlusOutlined />}>
                          Add Image
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                Add Variant
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}