import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Spin, Tag, message, Popconfirm } from 'antd';
import customerApi from '../api/customerAxios';
import { useCart } from '../context/CartContext';
import NetworkBackground from '../components/NetworkBackground';
import './Home.css';

interface OrderItem {
  id: number;
  variantId: number;
  productName: string;
  quantity: number;
  price: number;
  attributesSnapshot: string | null;
  variant?: {
    images?: { id: number; imageUrl: string }[];
    product?: { imageUrl: string | null };
  };
}

interface OrderDetailData {
  id: number;
  totalAmount: number;
  status: string;
  razorpayPaymentId?: string | null;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
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

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    customerApi
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await customerApi.post(`/orders/${id}/cancel`);
      setOrder(res.data);
      message.success('Order cancelled');
    } catch {
      message.error('Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        if (item.variantId) {
          await addToCart(item.variantId, item.quantity);
        }
      }
      message.success('Items added to cart');
      navigate('/cart');
    } catch {
      message.error('Some items could not be added — they may be out of stock');
    } finally {
      setReordering(false);
    }
  };

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
        <Link to="/orders" className="home-nav-login">Back to Orders</Link>
      </nav>

      <main className="home-main" style={{ maxWidth: 1100, margin: '40px auto', width: '100%', padding: '0 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '60px auto' }}>
            <Spin size="large" />
          </div>
        ) : !order ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>Order not found.</div>
        ) : (
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                background: '#f8f9fa',
                borderBottom: '1px solid #e5e7eb',
                padding: '40px 48px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 28 }}>Order #{order.id}</h2>
                <div style={{ fontSize: 15, color: '#6b7280', marginTop: 6 }}>
                  Placed on{' '}
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Tag color={statusColor[order.status] || 'default'} style={{ fontSize: 15, padding: '6px 16px' }}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Tag>
                <Tag
                  color={order.razorpayPaymentId ? 'green' : 'orange'}
                  style={{ fontSize: 15, padding: '6px 16px' }}
                >
                  {order.razorpayPaymentId ? 'Paid' : 'Payment Pending'}
                </Tag>
                <button
                  onClick={handleReorder}
                  disabled={reordering}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #4C6FFF',
                    background: '#fff',
                    color: '#4C6FFF',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: reordering ? 'not-allowed' : 'pointer',
                  }}
                >
                  {reordering ? 'Adding...' : 'Reorder'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await customerApi.get(`/orders/${order.id}/invoice`, {
                        responseType: 'blob',
                      });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `invoice-order-${order.id}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    } catch {
                      message.error('Could not download invoice');
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Download Invoice
                </button>
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <Popconfirm
                    title="Cancel this order?"
                    description="This action cannot be undone."
                    onConfirm={handleCancel}
                    okText="Yes, cancel"
                    cancelText="No"
                  >
                    <button
                      disabled={cancelling}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: '1px solid #ef4444',
                        background: '#fff',
                        color: '#ef4444',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: cancelling ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  </Popconfirm>
                )}
              </div>
            </div>

            {order.status !== 'cancelled' && (
              <div style={{ padding: '32px 48px', borderBottom: '1px solid #f3f4f6' }}>
                {(() => {
                  const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
                    const stepLabels: Record<string, string> = {
                    pending: 'Order Placed',
                    confirmed: 'Confirmed',
                    shipped: 'Shipped',
                    delivered: 'Delivered',
                    };
                  const currentIndex = steps.indexOf(order.status);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {steps.map((step, idx) => {
                        const isDone = idx <= currentIndex;
                        return (
                          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: isDone ? '#4C6FFF' : '#e5e7eb',
                                  color: isDone ? '#fff' : '#9ca3af',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  fontWeight: 600,
                                }}
                              >
                                {isDone ? '✓' : idx + 1}
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  marginTop: 6,
                                  color: isDone ? '#1f2937' : '#9ca3af',
                                  fontWeight: isDone ? 500 : 400,
                                  textAlign: 'center',
                                }}
                              >
                                {stepLabels[step]}
                              </span>
                            </div>
                            {idx < steps.length - 1 && (
                              <div
                                style={{
                                  flex: 1,
                                  height: 2,
                                  background: idx < currentIndex ? '#4C6FFF' : '#e5e7eb',
                                  marginBottom: 20,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {order.status === 'cancelled' && (
              <div style={{ padding: '20px 48px', background: '#fff1f0', borderBottom: '1px solid #ffa39e' }}>
                <span style={{ color: '#cf1322', fontSize: 14, fontWeight: 500 }}>
                  This order was cancelled.
                </span>
              </div>
            )}

            <div style={{ padding: '32px 48px', borderBottom: '1px solid #f3f4f6' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 16, color: '#374151' }}>Delivery Address</h4>
              <div style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.8 }}>
                {order.addressLine}, {order.city}, {order.state} {order.pincode}
                <br />
                {order.country} • Phone: {order.phone}
              </div>
            </div>

            <div style={{ padding: '32px 48px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 16, color: '#374151' }}>Items</h4>
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
                      gap: 20,
                      padding: '20px 0',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        height: 90,
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
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{item.productName}</div>
                      {attrParts.length > 0 && (
                        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{attrParts.join(' / ')}</div>
                      )}
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                        Qty: {item.quantity} × ₹{item.price}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>₹{item.price * item.quantity}</div>
                  </div>
                );
              })}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 24,
                  marginTop: 12,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                <span>Total</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}