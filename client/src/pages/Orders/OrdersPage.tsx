import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import OrdersTable from './OrdersTable';

const { Title, Text } = Typography;

export default function OrdersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<{ totalOrders: number; totalRevenue: number } | null>(null);

  useEffect(() => {
    api
      .get('/orders/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, [refreshKey]);

  const handleStatusChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Orders"
              value={stats?.totalOrders ?? 0}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Revenue"
              value={stats?.totalRevenue ?? 0}
              precision={2}
              prefix={<DollarOutlined />}
              formatter={(value) => `₹${Number(value).toFixed(2)}`}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: 28 } }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Orders
            </Title>
            <Text type="secondary">View customer orders and update their status.</Text>
          </div>
        </div>

        <OrdersTable refreshKey={refreshKey} onStatusChanged={handleStatusChanged} />
      </Card>
    </div>
  );
}