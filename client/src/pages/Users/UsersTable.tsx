import { useState, useEffect } from "react";
import { Table, Input, Switch, Popconfirm, message, Space, Button, Tag, Avatar, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import api from '../../api/axios';
import { hasPermission } from "../../utils/permissions";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
  roles?: Role[];
}

interface UsersTableProps {
  onEdit: (user: User) => void;
  refreshKey: number;
}

// Consistent color per role name so the same role always looks the same.
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'purple',
  EDITOR: 'blue',
  VIEWER: 'green',
};

const getRoleColor = (name: string) => ROLE_COLORS[name.toUpperCase()] ?? 'default';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

// Deterministic soft color for an avatar background, based on the name.
const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function UsersTable({ onEdit, refreshKey }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const showActions = hasPermission('USER_EDIT') || hasPermission('USER_DELETE');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users', {
          params: { page, limit: pageSize, search: search || undefined },
        });
        setUsers(response.data.data);
        setTotal(response.data.total ?? response.data.data.length);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        message.error('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshKey, page, pageSize, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      message.success('User deleted successfully.');
    } catch (err) {
      console.error('Failed to delete user:', err);
      message.error('Failed to delete user.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await api.patch(`/users/${user.id}`, { status: !user.status });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...response.data } : u)));
    } catch (err) {
      console.error('Failed to update status:', err);
      message.error('Failed to update user status.');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <Avatar style={{ backgroundColor: getAvatarColor(name) }} icon={!name ? <UserOutlined /> : undefined}>
            {name ? getInitials(name) : null}
          </Avatar>
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean, user) => (
        <Switch
          checked={status}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => handleToggleStatus(user)}
        />
      ),
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles?: Role[]) =>
        roles && roles.length > 0 ? (
          <Space size={4} wrap>
            {roles.map((r) => (
              <Tag key={r.id} color={getRoleColor(r.name)} style={{ borderRadius: 12, margin: 0 }}>
                {r.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>No roles</span>
        ),
    },
  ];

  if (showActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      render: (_, user) => (
        <Space>
          {hasPermission('USER_EDIT') && (
            <Tooltip title="Edit">
              <Button shape="circle" icon={<EditOutlined />} onClick={() => onEdit(user)} />
            </Tooltip>
          )}
          {hasPermission('USER_DELETE') && (
            <Popconfirm
              title="Delete this user?"
              description="This action cannot be undone."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(user.id)}
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
        dataSource={users}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p) => setPage(p) }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={search ? `No users found for "${search}"` : 'No users yet'}
              style={{ padding: '32px 0' }}
            />
          ),
        }}
      />
    </div>
  );
}