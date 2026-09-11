import { useState, useEffect } from "react";
import { Table, Input, Popconfirm, message, Space, Button, Tag, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from '../../api/axios';
import { hasPermission } from "../../utils/permissions";

interface Permission {
  id: number;
  code: string;
  name: string;
}

interface PermissionsTableProps {
  onEdit: (permission: Permission) => void;
  refreshKey: number;
}

export default function PermissionsTable({ onEdit, refreshKey }: PermissionsTableProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const showActions = hasPermission('PERMISSION_EDIT') || hasPermission('PERMISSION_DELETE');

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const response = await api.get('/permissions', {
          params: { page, limit: pageSize, search: search || undefined },
        });
        setPermissions(response.data.data);
        setTotal(response.data.total ?? response.data.data.length);
      } catch (err) {
        console.error('Failed to fetch permissions:', err);
        message.error('Failed to load permissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [refreshKey, page, pageSize, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/permissions/${id}`);
      setPermissions((prev) => prev.filter((p) => p.id !== id));
      message.success('Permission deleted successfully.');
    } catch (err) {
      console.error('Failed to delete permission:', err);
      message.error('Failed to delete permission.');
    }
  };

  const columns: ColumnsType<Permission> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Tag color="geekblue" style={{ borderRadius: 6, margin: 0, fontFamily: 'monospace' }}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
  ];

  if (showActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_, permission) => (
        <Space>
          {hasPermission('PERMISSION_EDIT') && (
            <Tooltip title="Edit">
              <Button shape="circle" icon={<EditOutlined />} onClick={() => onEdit(permission)} />
            </Tooltip>
          )}
          {hasPermission('PERMISSION_DELETE') && (
            <Popconfirm
              title="Delete this permission?"
              description="This action cannot be undone."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(permission.id)}
            >
              <Tooltip title="Delete">
                <Button shape="circle" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <div>
      <Input
        placeholder="Search by code..."
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        style={{ marginBottom: 16, width: 280, borderRadius: 8 }}
        allowClear
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={permissions}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p) => setPage(p) }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={search ? `No permissions found for "${search}"` : 'No permissions yet'}
              style={{ padding: '32px 0' }}
            />
          ),
        }}
      />
    </div>
  );
}