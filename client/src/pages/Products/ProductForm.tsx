import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Button, Card, Space, Divider, AutoComplete } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
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
  attributes?: Record<string, string> | null;
  stock?: number;
  price?: number | null;
  images?: VariantImage[];
}

// Form-only shape: attributes are edited as a key/value list, converted
// to/from Record<string,string> when loading/submitting the form.
interface AttributeEntry {
  key?: string;
  value?: string;
}

interface VariantFormEntry {
  attributes?: AttributeEntry[];
  stock?: number;
  price?: number;
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
  const watchedVariants = Form.useWatch('variants', form) as VariantFormEntry[] | undefined;

  // Suggest attribute keys already used elsewhere in this product (e.g. "Color", "Size", "Quantity")
  const attributeKeySuggestions = Array.from(
    new Set(
      (watchedVariants ?? [])
        .flatMap((v) => v?.attributes ?? [])
        .map((a) => a?.key)
        .filter(Boolean),
    ),
  ).map((k) => ({ value: k as string }));

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
      const formVariants: VariantFormEntry[] = (editingProduct.variants ?? []).map((v) => ({
        attributes: Object.entries(v.attributes ?? {}).map(([key, value]) => ({ key, value })),
        stock: v.stock ?? 0,
        price: v.price ?? undefined,
        images: (v.images ?? []).map((img) => ({ imageUrl: img.imageUrl })),
      }));

      form.setFieldsValue({
        ...editingProduct,
        categoryId: editingProduct.category?.id,
        variants: formVariants,
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

      const formVariants = (values.variants ?? []) as VariantFormEntry[];
      const variants = formVariants.map((v) => {
        const attributes: Record<string, string> = {};
        (v.attributes ?? []).forEach((a) => {
          if (a?.key) attributes[a.key] = a.value ?? '';
        });

        return {
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
          stock: v.stock ?? 0,
          price: v.price ?? undefined,
          images: (v.images ?? [])
            .filter((img: any) => img?.imageUrl)
            .map((img: any, idx: number) => ({ imageUrl: img.imageUrl, sortOrder: idx })),
        };
      });

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
                    <Space>
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        title="Duplicate variant"
                        onClick={() => {
                          const current = form.getFieldValue(['variants', name]);
                          add({ ...current, id: undefined }, name + 1);
                        }}
                      />
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Space>
                  }
                >
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Attributes</div>
                  <Form.List name={[name, 'attributes']}>
                    {(attrFields, { add: addAttr, remove: removeAttr }) => (
                      <>
                        {attrFields.map(({ key: attrKey, name: attrName, ...attrRestField }) => (
                          <Space key={attrKey} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                            <Form.Item
                              {...attrRestField}
                              name={[attrName, 'key']}
                              style={{ marginBottom: 0 }}
                            >
                              <AutoComplete
                                options={attributeKeySuggestions}
                                placeholder="e.g. Color, Size, Quantity"
                                filterOption={(inputValue, option) =>
                                  (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
                                }
                                style={{ width: 180 }}
                              />
                            </Form.Item>
                            <Form.Item
                              {...attrRestField}
                              name={[attrName, 'value']}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="e.g. Black, 200ml" style={{ width: 180 }} />
                            </Form.Item>
                            <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeAttr(attrName)} />
                          </Space>
                        ))}
                        <Button type="dashed" size="small" onClick={() => addAttr()} icon={<PlusOutlined />}>
                          Add Attribute
                        </Button>
                      </>
                    )}
                  </Form.List>

                  <Space style={{ display: 'flex', marginTop: 16 }} align="baseline" wrap>
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
              <Button
                type="dashed"
                onClick={() => add({ attributes: [{}] })}
                icon={<PlusOutlined />}
                block
              >
                Add Variant
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}