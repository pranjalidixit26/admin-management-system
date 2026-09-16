import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Spin, Tag, Empty } from 'antd';
import customerApi from '../api/customerAxios';
import NetworkBackground from '../components/NetworkBackground';
import './Home.css';

interface OrderItem {
    id: number;
    productName: string;
    attributesSnapshot: string | null;
    price: string;
    quantity: number;
}

interface Order {
    id: number;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
    items: OrderItem[];
    totalAmount: string;
    status: string;
    created_at: string;
}

export default function OrderConfirmation() {
    const { id } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        customerApi
            .get(`/orders/${id}`)
            .then((res) => setOrder(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [id]);

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

            <main className="home-main" style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '80px auto' }}>
                        <Spin size="large" />
                    </div>
                ) : error || !order ? (
                    <Empty description="Order not found" style={{ margin: '80px auto' }}>
                        <Link to="/" className="home-nav-login">Back to Home</Link>
                    </Empty>
                ) : (
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 10,
                            padding: 32,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 12px',
                                    fontSize: 28,
                                }}
                            >
                                ✓
                            </div>
                            <h2 style={{ margin: 0 }}>Order Placed Successfully!</h2>
                            <p style={{ color: '#6b7280', marginTop: 4 }}>
                                Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <Tag color="gold" style={{ marginTop: 4, textTransform: 'capitalize' }}>
                                {order.status}
                            </Tag>
                        </div>

                        <h4 style={{ marginBottom: 8 }}>Delivery Address</h4>
                        <p style={{ color: '#374151', fontSize: 14, marginBottom: 24 }}>
                            {order.addressLine}, {order.city}, {order.state} {order.pincode}
                            <br />
                            {order.country} • Phone: {order.phone}
                        </p>

                        <h4 style={{ marginBottom: 8 }}>Items</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {order.items.map((item) => {
                                let attrs: Record<string, string> = {};
                                try {
                                    attrs = item.attributesSnapshot ? JSON.parse(item.attributesSnapshot) : {};
                                } catch {
                                    attrs = {};
                                }
                                const attrParts = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`);
                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            borderBottom: '1px solid #f3f4f6',
                                            paddingBottom: 8,
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                            {attrParts.length > 0 && (
                                                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                                    {attrParts.join(' / ')}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                Qty: {item.quantity} × ₹{item.price}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 600 }}>
                                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 17,
                                fontWeight: 700,
                                borderTop: '1px solid #e5e7eb',
                                paddingTop: 16,
                            }}
                        >
                            <span>Total</span>
                            <span>₹{order.totalAmount}</span>
                        </div>

                        <Link
                            to="/"
                            className="home-add-to-cart"
                            style={{
                                display: 'block',
                                textAlign: 'center',
                                marginTop: 24,
                                textDecoration: 'none',
                            }}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}