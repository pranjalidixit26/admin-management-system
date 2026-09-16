import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tag, Skeleton } from 'antd';
import customerApi from '../api/customerAxios';
import NetworkBackground from '../components/NetworkBackground';
import './Home.css';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  attributesSnapshot: string | null;
  variant?: {
    images?: { id: number; imageUrl: string }[];
    product?: { imageUrl: string | null };
  };
}

interface OrderSummary {
  id: number;
  totalAmount: number;
  status: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
  items: OrderItem[];
}

const statusColor: Record<string, string> = {
  pending: 'orange',
  confirmed: 'blue',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

const statusTabs = ['all', 'pending', 'confirmed', 'cancelled'];

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    customerApi
      .get('/orders')
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders =
    activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  const getGroupLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isSameMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const isLastMonth =
      date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();

    if (isSameMonth) return 'This Month';
    if (isLastMonth) return 'Last Month';
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const label = getGroupLabel(order.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(order);
    return acc;
  }, {} as Record<string, OrderSummary[]>);

  const groupOrder = Object.keys(groupedOrders); // already in date-desc order since orders come sorted

  return (
    <div className="home">
      <div className="home-bg">
        <NetworkBackground />
      </div>

      <nav className="home-nav">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="home-logo">
            <svg
              className="home-logo-icon"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4C6FFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="home-logo-text">ShopNest</span>
          </span>
        </Link>
        <Link to="/" className="home-nav-login">Continue Shopping</Link>
      </nav>

      <main className="home-main" style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginBottom: 16 }}>Your Orders</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: activeTab === tab ? '1px solid #4C6FFF' : '1px solid #d1d5db',
                background: activeTab === tab ? '#eef2ff' : '#fff',
                color: activeTab === tab ? '#4C6FFF' : '#374151',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  padding: 20,
                }}
              >
                <Skeleton active paragraph={{ rows: 1 }} title={false} style={{ marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Skeleton.Image active style={{ width: 56, height: 56 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, color: '#1f2937' }}>
              {activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
            </h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
              {activeTab === 'all'
                ? "Looks like you haven't placed any orders. Start exploring our catalog!"
                : 'Try a different filter to see your other orders.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  View All Orders
                </button>
              )}
              <Link to="/" className="home-add-to-cart" style={{ padding: '8px 18px', fontSize: 13 }}>
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {groupOrder.map((groupLabel) => (
              <div key={groupLabel}>
                <h3 style={{ fontSize: 15, color: '#374151', marginBottom: 12 }}>{groupLabel}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {groupedOrders[groupLabel].map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      style={{
                        background: '#fff',
                        borderRadius: 10,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                {/* Header — Amazon-style order summary bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    background: '#f8f9fa',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '14px 20px',
                  }}
                >
                  <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>
                        Order Placed
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>
                        Total
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>₹{order.totalAmount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>
                        Ship To
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {order.city}, {order.state}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>
                      Order # {order.id}
                    </div>
                    <Tag color={statusColor[order.status] || 'default'} style={{ marginTop: 4 }}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Tag>
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '16px 20px' }}>
                  {order.items.map((item) => {
                    let attrs: Record<string, string> | null = null;
                    try {
                      attrs = item.attributesSnapshot ? JSON.parse(item.attributesSnapshot) : null;
                    } catch {
                      attrs = null;
                    }
                    const attrParts = attrs ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`) : [];

                    const imageUrl =
                      item.variant?.images?.[0]?.imageUrl || item.variant?.product?.imageUrl || null;

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '10px 0',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            flexShrink: 0,
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: '#f5f5f5',
                          }}
                        >
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{item.productName}</div>
                          {attrParts.length > 0 && (
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{attrParts.join(' / ')}</div>
                          )}
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            Qty: {item.quantity} × ₹{item.price}
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}