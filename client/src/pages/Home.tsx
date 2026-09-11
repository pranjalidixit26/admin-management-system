import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Dropdown, Input, Spin, Empty } from 'antd';
import type { MenuProps } from 'antd';
import axios from 'axios';
import './Home.css';
import NetworkBackground from '../components/NetworkBackground';

interface CustomerInfo {
  id: number;
  name: string;
  email: string;
}

interface CategoryTreeNode {
  id: number;
  name: string;
  parentId: number | null;
  subcategories: CategoryTreeNode[];
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: { id: number; name: string } | null;
  status: boolean;
}

export default function Home() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    axios
      .get('http://localhost:3000/categories/tree')
      .then((res) => setCategoryTree(res.data))
      .catch(() => setCategoryTree([]));
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: 100 };
    if (search) params.search = search;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;

    axios
      .get('http://localhost:3000/products/public', { params })
      .then((res) => setProducts(res.data.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, selectedCategoryId]);

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
    { type: 'divider' },
    { key: 'logout', label: 'Logout', onClick: handleLogout },
  ];

  // derive unique categories from the currently loaded products
  const flatCategories: { id: number; name: string }[] = [];
  categoryTree.forEach((c) => {
    flatCategories.push({ id: c.id, name: c.name });
    c.subcategories.forEach((sub) => flatCategories.push({ id: sub.id, name: sub.name }));
  });

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
        <section className="home-hero-slim">
          <h1 className="home-hero-title-slim">
            {customer ? `Welcome back, ${customer.name}!` : 'Everything you need, all in one place.'}
          </h1>
          <p className="home-hero-subtitle-slim">
            Browse our full catalog and find exactly what you're looking for.
          </p>
          <Input.Search
            placeholder="Search products..."
            allowClear
            onSearch={(val) => setSearch(val)}
            className="home-search-bar"
          />
        </section>

        <section className="home-shop-layout">
                    <aside className="home-sidebar">
            <h4 className="home-sidebar-title">Categories</h4>
            <button
              className={`home-sidebar-link ${selectedCategoryId === null ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(null)}
            >
              All Products
            </button>
            {categoryTree.map((c) => {
              const isExpanded = expandedCategoryIds.has(c.id);
              const hasChildren = c.subcategories.length > 0;
              return (
                <div key={c.id}>
                  <div className="home-sidebar-parent-row">
                    <button
                      className={`home-sidebar-link ${selectedCategoryId === c.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryId(c.id)}
                    >
                      {c.name}
                    </button>
                    {hasChildren && (
                      <button
                        className="home-sidebar-expand-btn"
                        onClick={() => toggleExpand(c.id)}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    )}
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="home-sidebar-subgroup">
                      {c.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          className={`home-sidebar-link home-sidebar-sublink ${
                            selectedCategoryId === sub.id ? 'active' : ''
                          }`}
                          onClick={() => setSelectedCategoryId(sub.id)}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

            <div className="home-product-grid-wrap">
            <h3 className="home-grid-heading">
              {selectedCategoryId === null
                ? 'All Products'
                : (flatCategories.find((c) => c.id === selectedCategoryId)?.name ?? 'Products')}
            </h3>
            <div className="home-product-grid">
            {loading ? (
              <div className="home-grid-loading"><Spin size="large" /></div>
            ) : products.length === 0 ? (
              <Empty description="No products found" style={{ margin: '48px auto' }} />
            ) : (
              products.map((p) => (
                <div className="home-product-card" key={p.id}>
                  <div className="home-product-image">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} />
                    ) : (
                      <div className="home-product-image-placeholder" />
                    )}
                  </div>
                  <div className="home-product-info">
                    {p.category && <span className="home-product-category">{p.category.name}</span>}
                    <h4 className="home-product-name">{p.name}</h4>
                    <div className="home-product-bottom">
                      <span className="home-product-price">₹{p.price}</span>
                      <button className="home-add-to-cart">Add to Cart</button>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer-full">
        <div className="home-footer-content">
          <div className="home-footer-col">
            <span className="home-footer-brand">ShopNest</span>
            <p className="home-footer-tagline">
              Everything you need, all in one place.
            </p>
          </div>
          <div className="home-footer-col">
            <h5>Shop by Category</h5>
                        {flatCategories.length === 0 ? (
              <span className="home-footer-muted">No categories yet</span>
            ) : (
              flatCategories.map((c) => (
                <button
                  key={c.id}
                  className="home-footer-link"
                  onClick={() => setSelectedCategoryId(c.id)}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="home-footer-bottom">
          © {new Date().getFullYear()} ShopNest
        </div>
      </footer>
    </div>
  );
}