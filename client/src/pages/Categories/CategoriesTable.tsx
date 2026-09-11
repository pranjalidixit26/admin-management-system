import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Popconfirm, message, Tag, Tooltip, Empty } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { hasPermission } from '../../utils/permissions';

interface Category {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
}

interface CategoriesTableProps {
  refreshKey: number;
  onEdit: (category: Category) => void;
}

export default function CategoriesTable({ refreshKey, onEdit }: CategoriesTableProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories', {
        params: { page, limit, search },
      });
      setCategories(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [refreshKey, page, search]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('Category deleted');
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error('Failed to delete category');
    }
  };

  const showActions = hasPermission('CATEGORY_EDIT') || hasPermission('CATEGORY_DELETE');

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) =>
        description ? description : <span style={{ color: '#999' }}>No description</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => (
        <Tag color={status ? 'green' : 'red'} style={{ borderRadius: 12, margin: 0 }}>
          {status ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    ...(showActions
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Category) => (
              <Space>
                {hasPermission('CATEGORY_EDIT') && (
                  <Tooltip title="Edit">
                    <Button shape="circle" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                  </Tooltip>
                )}
                {hasPermission('CATEGORY_DELETE') && (
                  <Popconfirm
                    title="Delete this category?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(record.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="No"
                  >
                    <Tooltip title="Delete">
                      <Button shape="circle" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Input.Search
        placeholder="Search categories"
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        style={{ marginBottom: 16, maxWidth: 300 }}
        allowClear
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={categories}
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (p) => setPage(p),
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={search ? `No categories found for "${search}"` : 'No categories yet'}
              style={{ padding: '32px 0' }}
            />
          ),
        }}
      />
    </div>
  );
}