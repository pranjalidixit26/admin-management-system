import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Input, Spin, Empty, Modal, Tag, message } from 'antd';
import type { MenuProps } from 'antd';
import axios from 'axios';
import './Home.css';
import NetworkBackground from '../components/NetworkBackground';
import { useCart } from '../context/CartContext';

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

interface ProductVariant {
  id: number;
  sku: string;
  productId: number;
  color: string | null;
  size: string | null;
  stock: number;
  price: number | null;
  images: { id: number; imageUrl: string }[];
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
  variants: ProductVariant[];
}

// Builds a readable label for a variant chip, e.g. "Red / M", "Red", "M", or "Standard"
function variantLabel(v: ProductVariant): string {
  const parts = [v.color, v.size].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Standard';
}

export default function Home() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
    const { addToCart, totalItems } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (variantId: number, qty: number) => {
    if (!customer) {
      message.warning('Please login to add items to your cart');
      navigate('/customer-login');
      return;
    }
    try {
      await addToCart(variantId, qty);
      message.success('Item has been added to your cart');
    } catch {
      message.error('Could not add item — please try again');
    }
  };

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

  const openProductModal = (p: Product) => {
    setSelectedProduct(p);
    setSelectedVariant(p.variants?.[0] ?? null);
    setSelectedQty(1);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link to="/cart" style={{ position: 'relative', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {totalItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: '#4C6FFF',
                color: '#fff',
                borderRadius: '50%',
                width: 18,
                height: 18,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
            {totalItems}
            </span>
          )}
        </Link>
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
        </div>
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
              products.map((p) => {
                const hasMultipleVariants = (p.variants?.length ?? 0) > 1;
                const singleVariant = p.variants?.length === 1 ? p.variants[0] : null;
                return (
                <div
                  className="home-product-card"
                  key={p.id}
                  onClick={() => openProductModal(p)}
                  style={{ cursor: 'pointer' }}
                >
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
                        {hasMultipleVariants ? (
                          <button
                            className="home-add-to-cart"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProductModal(p);
                            }}
                          >
                            Select Options
                          </button>
                        ) : (
                          <button
                            className="home-add-to-cart"
                            onClick={(e) => {
                            e.stopPropagation();
                            if (singleVariant) handleAddToCart(singleVariant.id, 1);
                            }}
                            disabled={!singleVariant || singleVariant.stock === 0}
                        >
                            Add to Cart
                      </button>
                        )}
                    </div>
                  </div>
                </div>
                );
              })
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
      <h5>Quick Links</h5>
      <Link to="/" className="home-footer-link" style={{ display: 'block' }}>Home</Link>
      <Link to="/cart" className="home-footer-link" style={{ display: 'block' }}>Cart</Link>
      {customer ? (
        <button className="home-footer-link" onClick={handleLogout}>Logout</button>
      ) : (
        <Link to="/customer-login" className="home-footer-link" style={{ display: 'block' }}>Sign In</Link>
      )}
    </div>
    <div className="home-footer-col">
      <h5>Shop by Category</h5>
      {categoryTree.length === 0 ? (
        <span className="home-footer-muted">No categories yet</span>
      ) : (
        categoryTree.map((c) => (
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

      <Modal
        open={selectedProduct !== null}
        onCancel={() => setSelectedProduct(null)}
        footer={null}
        width={640}
        centered
      >
        {selectedProduct && (
          <div style={{ display: 'flex', gap: 24, paddingTop: 8 }}>
            <div
              style={{
                width: 220,
                height: 220,
                flexShrink: 0,
                borderRadius: 8,
                overflow: 'hidden',
                background: '#f5f5f5',
              }}
            >
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {selectedProduct.category && (
                <span style={{ fontSize: 12, color: '#4C6FFF', fontWeight: 600, textTransform: 'uppercase' }}>
                  {selectedProduct.category.name}
                </span>
              )}
              <h2 style={{ margin: '6px 0', fontSize: 22 }}>{selectedProduct.name}</h2>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
                ₹{selectedVariant?.price ?? selectedProduct.price}
              </div>

              {(selectedProduct.variants?.length ?? 0) > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                    Options:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVariant(v);
                          setSelectedQty(1);
                        }}
                        disabled={v.stock === 0}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          border: selectedVariant?.id === v.id ? '2px solid #4C6FFF' : '1px solid #d1d5db',
                          background: selectedVariant?.id === v.id ? '#eef2ff' : '#fff',
                          color: v.stock === 0 ? '#9ca3af' : '#1f2937',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                          textDecoration: v.stock === 0 ? 'line-through' : 'none',
                        }}
                      >
                        {variantLabel(v)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Tag
                color={(selectedVariant?.stock ?? 0) > 0 ? 'green' : 'red'}
                style={{ width: 'fit-content', marginBottom: 12 }}
              >
                {(selectedVariant?.stock ?? 0) > 0
                  ? `In Stock (${selectedVariant?.stock})`
                  : 'Out of Stock'}
              </Tag>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Quantity:</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    style={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      background: '#f3f4f6',
                      fontSize: 16,
                      cursor: !selectedVariant || selectedVariant.stock === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    −
                  </button>
                  <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
                    {selectedQty}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedQty((q) => Math.min(selectedVariant?.stock || 1, q + 1))
                    }
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    style={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      background: '#f3f4f6',
                      fontSize: 16,
                      cursor: !selectedVariant || selectedVariant.stock === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, flex: 1 }}>
                {selectedProduct.description || 'No description available.'}
              </p>
                <button
                    className="home-add-to-cart"
                    style={{ alignSelf: 'flex-start', marginTop: 12 }}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    onClick={() => {
                    if (!selectedVariant) return;
                    handleAddToCart(selectedVariant.id, selectedQty);
                    setSelectedProduct(null);
                    }}
                >
                    Add to Cart
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}