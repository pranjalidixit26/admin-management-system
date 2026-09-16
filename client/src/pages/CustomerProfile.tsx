import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Dropdown, Empty, Form, Input, Modal, Popconfirm, Tag, message } from 'antd';
import type { MenuProps } from 'antd';
import customerApi from '../api/customerAxios';
import '../pages/Home.css';
import NetworkBackground from '../components/NetworkBackground';
import { useCart } from '../context/CartContext';

interface Address {
    id: number;
    label: string | null;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
    isDefault: boolean;
}

export default function CustomerProfile() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { totalItems } = useCart();
    const customer = (() => {
        try {
            const stored = localStorage.getItem('customer');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    })();

    const handleLogout = () => {
        localStorage.removeItem('customer_access_token');
        localStorage.removeItem('customer');
        navigate('/');
    };

    const menuItems: MenuProps['items'] = [
        {
            key: 'info',
            label: (
                <div style={{ padding: '4px 0' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{customer?.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{customer?.email}</div>
                </div>
            ),
        },
        { type: 'divider' },
        { key: 'account', label: 'My Account', onClick: () => navigate('/account') },
        { key: 'logout', label: 'Logout', onClick: handleLogout },
    ];

    const loadAddresses = () => {
        setLoading(true);
        customerApi
            .get('/addresses')
            .then((res) => setAddresses(res.data))
            .catch(() => message.error('Could not load addresses'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const token = localStorage.getItem('customer_access_token');
        if (!token) {
            navigate('/customer-login');
            return;
        }
        loadAddresses();
    }, []);

    const openAddModal = () => {
        setEditingAddress(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEditModal = (address: Address) => {
        setEditingAddress(address);
        form.setFieldsValue(address);
        setModalOpen(true);
    };

    const handleSubmit = async (values: Omit<Address, 'id' | 'isDefault'>) => {
        try {
            if (editingAddress) {
                await customerApi.patch(`/addresses/${editingAddress.id}`, values);
                message.success('Address updated');
            } else {
                await customerApi.post('/addresses', values);
                message.success('Address added');
            }
            setModalOpen(false);
            loadAddresses();
        } catch {
            message.error('Something went wrong');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await customerApi.delete(`/addresses/${id}`);
            message.success('Address removed');
            loadAddresses();
        } catch {
            message.error('Could not remove address');
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await customerApi.patch(`/addresses/${id}/default`);
            message.success('Default address updated');
            loadAddresses();
        } catch {
            message.error('Could not set default address');
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <NetworkBackground />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <nav className="home-nav">
                    <Link to="/" className="home-logo" style={{ textDecoration: 'none' }}>
                        <svg className="home-logo-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4C6FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                            <path d="M3 6h18" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span className="home-logo-text">ShopNest</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <Link to="/cart" style={{ position: 'relative', cursor: 'pointer', display: 'flex' }}>
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            {totalItems > 0 && (
                                <span style={{ position: 'absolute', top: -10, right: -10, background: '#4C6FFF', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
                            <div style={{ cursor: 'pointer' }}>
                                <Avatar size={42} style={{ backgroundColor: '#4f46e5' }}>
                                    {customer?.name?.[0]?.toUpperCase()}
                                </Avatar>
                            </div>
                        </Dropdown>
                    </div>
                </nav>

                <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
                    <div style={{ marginBottom: 16, fontSize: 13, color: '#9ca3af' }}>
                        <Link to="/" style={{ color: '#9ca3af' }}>Home</Link>
                        <span style={{ margin: '0 6px' }}>/</span>
                        <span style={{ color: '#4b5563' }}>My Account</span>
                    </div>
                    <h2 style={{ marginBottom: 20 }}>My Account</h2>

                    <Card
                        title="My Addresses"
                        extra={
                            <Button type="primary" onClick={openAddModal}>
                                Add New Address
                            </Button>
                        }
                        loading={loading}
                    >
                        {addresses.length === 0 ? (
                            <Empty description="No addresses saved yet" />
                        ) : (
                            addresses.map((addr) => (
                                <Card
                                    key={addr.id}
                                    type="inner"
                                    style={{ marginBottom: 12 }}
                                    title={
                                        <>
                                            {addr.label || 'Address'}
                                            {addr.isDefault && (
                                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                                    Default
                                                </Tag>
                                            )}
                                        </>
                                    }
                                    extra={
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {!addr.isDefault && (
                                                <Button size="small" onClick={() => handleSetDefault(addr.id)}>
                                                    Set as Default
                                                </Button>
                                            )}
                                            <Button size="small" onClick={() => openEditModal(addr)}>
                                                Edit
                                            </Button>
                                            <Popconfirm
                                                title="Remove this address?"
                                                onConfirm={() => handleDelete(addr.id)}
                                            >
                                                <Button size="small" danger>
                                                    Delete
                                                </Button>
                                            </Popconfirm>
                                        </div>
                                    }
                                >
                                    <p style={{ margin: 0 }}>{addr.addressLine}</p>
                                    <p style={{ margin: 0 }}>
                                        {addr.city}, {addr.state} {addr.pincode}
                                    </p>
                                    <p style={{ margin: 0 }}>{addr.country}</p>
                                    <p style={{ margin: 0 }}>Phone: {addr.phone}</p>
                                </Card>
                            ))
                        )}
                    </Card>

                    <Modal
                        title={editingAddress ? 'Edit Address' : 'Add New Address'}
                        open={modalOpen}
                        onCancel={() => setModalOpen(false)}
                        onOk={() => form.submit()}
                        okText="Save"
                    >
                        <Form form={form} layout="vertical" onFinish={handleSubmit}>
                            <Form.Item name="label" label="Label (e.g. Home, Work)">
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="addressLine"
                                label="Address"
                                rules={[{ required: true, message: 'Address is required' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="city"
                                label="City"
                                rules={[{ required: true, message: 'City is required' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="state"
                                label="State"
                                rules={[{ required: true, message: 'State is required' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="pincode"
                                label="Pincode"
                                rules={[{ required: true, message: 'Pincode is required' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="country"
                                label="Country"
                                rules={[{ required: true, message: 'Country is required' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="phone"
                                label="Phone"
                                rules={[{ required: true, message: 'Phone is required' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </div>
        </div>
    );
}