import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import './Home.css';
import NetworkBackground from '../components/NetworkBackground';

interface CustomerInfo {
  id: number;
  name: string;
  email: string;
}

const features = [
  {
    title: 'Users',
    desc: 'Create accounts, assign roles, and control who has access.',
  },
  {
    title: 'Roles & Permissions',
    desc: 'Define exactly what each role can view, edit, or delete.',
  },
  {
    title: 'Categories',
    desc: 'Organize your product catalog into clear, searchable groups.',
  },
  {
    title: 'Products',
    desc: 'Track inventory, pricing, and status in one shared view.',
  },
];

export default function Home() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch {
        setCustomer(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customer_access_token');
    localStorage.removeItem('customer');
    setCustomer(null);
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
  {
    type: 'divider',
  },
  {
    key: 'logout',
    label: 'Logout',
    onClick: handleLogout,
  },
];

  return (
    <div className="home">
        <div className="home-bg">
            <NetworkBackground />
        </div>
      <nav className="home-nav">
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
        {customer ? (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
            <div style={{ cursor: 'pointer' }}>
                <Avatar size={32} style={{ backgroundColor: '#4f46e5' }}>
                {customer.name?.[0]?.toUpperCase()}
                </Avatar>
            </div>
            </Dropdown>
        ) : (
          <Link to="/customer-login" className="home-nav-login">Sign In</Link>
        )}
      </nav>

      <main className="home-main">
        <section className="home-hero">
          <div>
            <h1 className="home-hero-title">Run your team and catalog from one place.</h1>
            <p className="home-hero-subtitle">
              Manage users, roles, permissions, and your product catalog with
              fine-grained control over who can do what.
            </p>
            {customer ? (
              <p style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                Welcome back, {customer.name}!
              </p>
            ) : (
              <Link to="/customer-login" className="home-hero-cta">Sign in to start shopping</Link>
            )}
          </div>

          <div className="home-mockup">
            <div className="home-mockup-bar">
              <span className="home-mockup-dot" />
              <span className="home-mockup-dot" />
              <span className="home-mockup-dot" />
            </div>
            <div className="home-mockup-body">
              <div className="home-mockup-sidebar">
                <span className="active" />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="home-mockup-content">
                <div className="home-mockup-row" style={{ width: '70%' }} />
                <div className="home-mockup-row" style={{ width: '45%' }} />
                <div className="home-mockup-row" style={{ width: '85%' }} />
                <div className="home-mockup-chart">
                  <div style={{ height: '40%' }} />
                  <div style={{ height: '70%' }} />
                  <div style={{ height: '55%' }} />
                  <div style={{ height: '90%' }} />
                  <div style={{ height: '65%' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-features">
          {features.map((f) => (
            <div className="home-feature-card" key={f.title}>
              <h3 className="home-feature-title">{f.title}</h3>
              <p className="home-feature-desc">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="home-footer">
        © {new Date().getFullYear()} Admin Panel
      </footer>
    </div>
  );
}