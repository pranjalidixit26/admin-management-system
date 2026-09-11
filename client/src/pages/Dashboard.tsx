import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, List, Tag, Alert, Space } from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import api from '../api/axios'; // adjust path if DashboardPage isn't directly under src/pages

const { Title, Text } = Typography;

interface Role {
  id: number;
  name: string;
  status?: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: Category;
  createdAt?: string;
}

interface User {
  id: number;
  name: string;
  roles?: Role[];
  createdAt?: string;
}

interface ChartDatum {
  name: string;
  count: number;
}

const CHART_COLOR = '#6366f1';
const LOW_STOCK_THRESHOLD = 5;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [activeRoleCount, setActiveRoleCount] = useState(0);
  const [productsByCategory, setProductsByCategory] = useState<ChartDatum[]>([]);
  const [usersByRole, setUsersByRole] = useState<ChartDatum[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [usersRes, productsRes, categoriesRes, rolesRes] = await Promise.all([
          api.get('/users', { params: { page: 1, limit: 1000 } }),
          api.get('/products', { params: { page: 1, limit: 1000 } }),
          api.get('/categories', { params: { page: 1, limit: 1000 } }),
          api.get('/roles', { params: { page: 1, limit: 1000 } }),
        ]);

        const users: User[] = usersRes.data.data;
        const products: Product[] = productsRes.data.data;
        const categories: Category[] = categoriesRes.data.data;
        const roles: Role[] = rolesRes.data.data;

        setUserCount(usersRes.data.total ?? users.length);
        setProductCount(productsRes.data.total ?? products.length);
        setCategoryCount(categoriesRes.data.total ?? categories.length);
        setActiveRoleCount(roles.filter((r) => r.status !== false).length);

        // Group products by category name
        const productGroups: Record<string, number> = {};
        products.forEach((p) => {
          const key = p.category?.name ?? 'Uncategorized';
          productGroups[key] = (productGroups[key] ?? 0) + 1;
        });
        setProductsByCategory(
          Object.entries(productGroups).map(([name, count]) => ({ name, count }))
        );

        // Group users by role name (a user can have multiple roles)
        const roleGroups: Record<string, number> = {};
        users.forEach((u) => {
          if (u.roles && u.roles.length > 0) {
            u.roles.forEach((r) => {
              roleGroups[r.name] = (roleGroups[r.name] ?? 0) + 1;
            });
          } else {
            roleGroups['No role'] = (roleGroups['No role'] ?? 0) + 1;
          }
        });
        setUsersByRole(
          Object.entries(roleGroups).map(([name, count]) => ({ name, count }))
        );

        // Low stock products (stock at or below threshold), worst first
        setLowStockProducts(
          products
            .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5)
        );

        // Total inventory value = sum(price * stock)
        const totalValue = products.reduce(
          (sum, p) => sum + Number(p.price) * Number(p.stock),
          0
        );
        setInventoryValue(totalValue);

        // Recent activity: last 5 products / users (assumes createdAt exists; falls back to id order)
        const sortByRecency = <T extends { createdAt?: string; id: number }>(items: T[]) =>
          [...items].sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return b.id - a.id;
          });

        setRecentProducts(sortByRecency(products).slice(0, 5));
        setRecentUsers(sortByRecency(users).slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Users', value: userCount, icon: <UserOutlined />, color: '#6366f1' },
    { title: 'Total Products', value: productCount, icon: <ShoppingOutlined />, color: '#0ea5e9' },
    { title: 'Total Categories', value: categoryCount, icon: <AppstoreOutlined />, color: '#10b981' },
    { title: 'Active Roles', value: activeRoleCount, icon: <SafetyCertificateOutlined />, color: '#f59e0b' },
  ];

  const cardStyle = {
    borderRadius: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.04)',
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>
        Dashboard
      </Title>
      <Text type="secondary">Overview of your workspace at a glance.</Text>

      <Spin spinning={loading}>
        {/* Stat cards */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {statCards.map((stat) => (
            <Col xs={24} sm={12} lg={6} key={stat.title}>
              <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${stat.color}1A`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                      fontSize: 20,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <Statistic title={stat.title} value={stat.value} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

                {/* Inventory value + low stock alert */}
        <Row gutter={[16, 16]} style={{ marginTop: 16, alignItems: 'stretch' }}>
          <Col xs={24} md={8} style={{ display: 'flex' }}>
            <Card
              style={{ ...cardStyle, width: '100%' }}
              styles={{ body: { padding: 20, height: '100%', display: 'flex', alignItems: 'center' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#10b9811A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  <WalletOutlined />
                </div>
                <Statistic
                  title="Total Inventory Value"
                  value={inventoryValue}
                  precision={2}
                  prefix="₹"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} md={16} style={{ display: 'flex' }}>
            <Card
              style={{ ...cardStyle, width: '100%' }}
              styles={{ body: { padding: 20, height: '100%', display: 'flex', alignItems: 'center' } }}
            >
              {lowStockProducts.length > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  message={`${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's are' : ' is'} low on stock`}
                  description={
                    <Space size={[6, 6]} wrap style={{ marginTop: 6 }}>
                      {lowStockProducts.map((p) => (
                        <Tag
                          key={p.id}
                          color={p.stock === 0 ? 'red' : 'orange'}
                          style={{ borderRadius: 12, margin: 0 }}
                        >
                          {p.name} ({p.stock === 0 ? 'out of stock' : `${p.stock} left`})
                        </Tag>
                      ))}
                    </Space>
                  }
                  style={{ width: '100%' }}
                />
              ) : (
                <Alert
                  type="success"
                  showIcon
                  message="All products are well stocked"
                  description="No products are currently low on stock."
                  style={{ width: '100%' }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Products by Category" style={cardStyle}>
              {productsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={productsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text type="secondary">No product data yet.</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Users by Role" style={cardStyle}>
              {usersByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={usersByRole}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text type="secondary">No user data yet.</Text>
              )}
            </Card>
          </Col>
        </Row>

        {/* Recent activity */}
        <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Recently Added Products" style={cardStyle}>
              <List
                dataSource={recentProducts}
                locale={{ emptyText: 'No products yet' }}
                renderItem={(p) => (
                  <List.Item>
                    <Text strong>{p.name}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {p.category?.name ?? 'Uncategorized'}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Recently Added Users" style={cardStyle}>
              <List
                dataSource={recentUsers}
                locale={{ emptyText: 'No users yet' }}
                renderItem={(u) => (
                  <List.Item>
                    <Text strong>{u.name}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {u.roles && u.roles.length > 0 ? u.roles.map((r) => r.name).join(', ') : 'No role'}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}