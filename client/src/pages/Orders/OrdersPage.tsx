import { useState } from 'react';
import { Card, Typography } from 'antd';
import OrdersTable from './OrdersTable';

const { Title, Text } = Typography;

export default function OrdersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStatusChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
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