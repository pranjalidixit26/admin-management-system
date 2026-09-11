import { useState, useEffect } from "react";
import { Table, Input, Switch, Popconfirm, message, Space, Button, Tag, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import api from '../../api/axios';
import { hasPermission } from "../../utils/permissions";

interface Permission {
  id: number;
  code: string;
  name: string;
}

interface Role {
  id: number;
  name: string;
  status: boolean;
  permissions?: Permission[];
}

interface RolesTableProps {
  onEdit: (role: Role) => void;
  refreshKey: number;
}

const MAX_VISIBLE_PERMISSIONS = 3;

export default function RolesTable({ onEdit, refreshKey }: RolesTableProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const showActions = hasPermission('ROLE_EDIT') || hasPermission('ROLE_DELETE');

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await api.get('/roles', {
          params: { page, limit: pageSize, search: search || undefined },
        });
        setRoles(response.data.data);
        setTotal(response.data.total ?? response.data.data.length);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
        message.error('Failed to load roles.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [refreshKey, page, pageSize, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/roles/${id}`);
      setRoles((prev) => prev.filter((role) => role.id !== id));
      message.success('Role deleted successfully.');
    } catch (err) {
      console.error('Failed to delete role:', err);
      message.error('Failed to delete role.');
    }
  };

  const handleToggleStatus = async (role: Role) => {
    try {
      const response = await api.patch(`/roles/${role.id}`, { status: !role.status });
      setRoles((prev) => prev.map((r) => (r.id === role.id ? response.data : r)));
    } catch (err) {
      console.error('Failed to update status:', err);
      message.error('Failed to update role status.');
    }
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#6366f1', fontSize: 16 }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean, role) => (
        <Switch
          checked={status}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => handleToggleStatus(role)}
        />
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions?: Permission[]) => {
        if (!permissions || permissions.length === 0) {
          return <span style={{ color: '#999' }}>No permissions</span>;
        }
        const visible = permissions.slice(0, MAX_VISIBLE_PERMISSIONS);
        const remaining = permissions.length - visible.length;
        return (
          <Space size={4} wrap>
            {visible.map((p) => (
              <Tag key={p.id} color="geekblue" style={{ borderRadius: 12, margin: 0 }}>
                {p.code}
              </Tag>
            ))}
            {remaining > 0 && (
              <Tooltip title={permissions.slice(MAX_VISIBLE_PERMISSIONS).map((p) => p.code).join(', ')}>
                <Tag style={{ borderRadius: 12, margin: 0, cursor: 'default' }}>+{remaining} more</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  if (showActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_, role) => (
        <Space>
          {hasPermission('ROLE_EDIT') && (
            <Tooltip title="Edit">
              <Button shape="circle" icon={<EditOutlined />} onClick={() => onEdit(role)} />
            </Tooltip>
          )}
          {hasPermission('ROLE_DELETE') && (
            <Popconfirm
              title="Delete this role?"
              description="This action cannot be undone."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(role.id)}
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
        placeholder="Search by name..."
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        style={{ marginBottom: 16, width: 280, borderRadius: 8 }}
        allowClear
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={roles}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p) => setPage(p) }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={search ? `No roles found for "${search}"` : 'No roles yet'}
              style={{ padding: '32px 0' }}
            />
          ),
        }}
      />
    </div>
  );
}