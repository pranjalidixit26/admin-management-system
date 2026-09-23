import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Input, Empty, Modal, Tag, Select, message, Skeleton } from 'antd';
import type { MenuProps } from 'antd';
import axios from 'axios';
import './Home.css';
import NetworkBackground from '../components/NetworkBackground';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

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
  attributes: Record<string, string> | null;
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

export default function Home() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sort, setSort] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQty, setSelectedQty] = useState<number>(1);
    const { addToCart, totalItems } = useCart();
    const { wishlistedProductIds, addToWishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const handleToggleWishlist = async (e: React.MouseEvent, productId: number, variantId?: number) => {
    e.stopPropagation();
    if (!customer) {
      message.warning('Please login to use your wishlist');
      navigate('/customer-login');
      return;
    }
    try {
      if (wishlistedProductIds.has(productId)) {
        await removeFromWishlist(productId);
        message.success('Removed from wishlist');
      } else {
        await addToWishlist(productId, variantId);
        message.success('Added to wishlist');
      }
    } catch {
      message.error('Could not update wishlist');
    }
  };

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
      .get(`${import.meta.env.VITE_API_URL}/categories/tree`)
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
    if (sort) params.sort = sort;
    const nonEmptyFilters = Object.fromEntries(
      Object.entries(activeFilters).filter(([, values]) => values.length > 0),
    );
    if (Object.keys(nonEmptyFilters).length > 0) {
      params.attributes = JSON.stringify(nonEmptyFilters);
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/products/public`, { params })
      .then((res) => setProducts(res.data.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, selectedCategoryId, sort, activeFilters]);

  const handleLogout = () => {
    localStorage.removeItem('customer_access_token');
    localStorage.removeItem('customer');
    setCustomer(null);
  };

    const getCategoryIcon = (name: string): string => {
      const map: Record<string, string> = {
        Electronics: '📱',
        Clothing: '👕',
        'Home & Kitchen': '🏠',
        'Beauty & Personal Care': '💄',
        'Books & Stationery': '📚',
        'Sports & Fitness': '🏋️',
        'Toys & Games': '🧸',
        Groceries: '🛒',
        Footwear: '👟',
      };
      return map[name] ?? '🏷️';
    };

    const openProductModal = (p: Product) => {
        setSelectedProduct(p);
        const first = p.variants?.[0] ?? null;
        setSelectedAttributes(first?.attributes ? { ...first.attributes } : {});
        setSelectedQty(1);
        setActiveImageIndex(0);
    };

    // Ordered list of distinct attribute keys across this product's variants.
    // "Color" (if present) always comes first so it renders as the primary selector.
    const attributeKeys = selectedProduct
      ? (() => {
          const keysSet = new Set<string>();
          selectedProduct.variants.forEach((v) => {
            Object.keys(v.attributes ?? {}).forEach((k) => keysSet.add(k));
          });
          const keys = Array.from(keysSet);
          keys.sort((a, b) => {
            if (a.toLowerCase() === 'color') return -1;
            if (b.toLowerCase() === 'color') return 1;
            return 0;
          });
          return keys;
        })()
      : [];

    // The single variant matching every currently selected attribute value
    const selectedVariant =
      selectedProduct?.variants.find((v) =>
        attributeKeys.every((key) => (v.attributes?.[key] ?? '') === (selectedAttributes[key] ?? '')),
      ) ?? null;

    // Variants that match the selections made for attribute keys BEFORE the given key
    // (used to narrow down which option values are relevant to show for that key)
    const variantsMatchingPriorSelections = (key: string) => {
      if (!selectedProduct) return [];
      const priorKeys = attributeKeys.slice(0, attributeKeys.indexOf(key));
      return selectedProduct.variants.filter((v) =>
        priorKeys.every((k) => (v.attributes?.[k] ?? '') === (selectedAttributes[k] ?? '')),
      );
    };

    // Unique option values for a given attribute key, each with one representative variant
    // (used for the Color swatch thumbnail, and for stock-checking the last attribute)
    const optionsForKey = (key: string) => {
      const candidates = variantsMatchingPriorSelections(key);
      const seen = new Map<string, ProductVariant>();
      candidates.forEach((v) => {
        const val = v.attributes?.[key];
        if (val && !seen.has(val)) seen.set(val, v);
      });
      return Array.from(seen.entries()).map(([value, variant]) => ({ value, variant }));
    };

    const handleAttributeSelect = (key: string, value: string) => {
      if (!selectedProduct) return;
      setSelectedAttributes((prev) => {
        const next = { ...prev, [key]: value };
        // If this change invalidates a later attribute's current selection, fall back
        // to the first still-available option for that later attribute
        const keyIndex = attributeKeys.indexOf(key);
        for (let i = keyIndex + 1; i < attributeKeys.length; i++) {
          const laterKey = attributeKeys[i];
          const stillValid = selectedProduct.variants.some((v) =>
            attributeKeys.slice(0, i + 1).every((k) => (v.attributes?.[k] ?? '') === (next[k] ?? '')),
          );
          if (!stillValid) {
            const fallback = selectedProduct.variants.find((v) =>
              attributeKeys.slice(0, i).every((k) => (v.attributes?.[k] ?? '') === (next[k] ?? '')),
            );
            if (fallback?.attributes?.[laterKey]) {
              next[laterKey] = fallback.attributes[laterKey];
            }
          }
        }
        return next;
      });
      setSelectedQty(1);
      setActiveImageIndex(0);
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
    { key: 'orders', label: 'My Orders', onClick: () => navigate('/orders') },
    { key: 'logout', label: 'Logout', onClick: handleLogout },
  ];

  useEffect(() => {
    const params: Record<string, number> = {};
    if (selectedCategoryId) params.categoryId = selectedCategoryId;

    axios
      .get(`${import.meta.env.VITE_API_URL}/products/public/filters`, { params })
      .then((res) => setFilters(res.data))
      .catch(() => setFilters({}));

    // category badalne par purane attribute filters ab valid na ho, isliye reset
    setActiveFilters({});
  }, [selectedCategoryId]);

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
            width="30"
            height="30"
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
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {totalItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                background: '#4C6FFF',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                fontSize: 12,
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
              <Avatar size={42} style={{ backgroundColor: '#4f46e5' }}>
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
            onChange={(e) => {
              if (e.target.value === '') {
                setSearch('');
              }
            }}
            className="home-search-bar"
          />
        </section>

        <section className="home-promo-banner">
          <div className="home-promo-content">
            <span className="home-promo-tag">Limited Time</span>
            <h3 className="home-promo-title">Big Savings Across Categories</h3>
            <p className="home-promo-desc">Explore deals on Electronics, Fashion, Home & Kitchen, and more.</p>
          </div>
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
                      <span style={{ marginRight: 8 }}>{getCategoryIcon(c.name)}</span>
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Select
                value={sort || undefined}
                placeholder="Sort by"
                allowClear
                style={{ width: 180 }}
                onChange={(val) => setSort(val ?? '')}
                options={[
                  { value: 'price_asc', label: 'Price: Low to High' },
                  { value: 'price_desc', label: 'Price: High to Low' },
                ]}
              />
                            <Select
                mode="multiple"
                placeholder="Filter by attribute"
                allowClear
                style={{ minWidth: 260 }}
                maxTagCount={3}
                value={Object.entries(activeFilters).flatMap(([key, vals]) =>
                  vals.map((v) => `${key}::${v}`),
                )}
                onChange={(selected: string[]) => {
                  const next: Record<string, string[]> = {};
                  selected.forEach((item) => {
                    const [key, value] = item.split('::');
                    if (!next[key]) next[key] = [];
                    next[key].push(value);
                  });
                  setActiveFilters(next);
                }}
                options={Object.entries(filters).map(([key, values]) => ({
                  label: key,
                  title: key,
                  options: values.map((v) => ({
                    value: `${key}::${v}`,
                    label: v,
                  })),
                }))}
              />
            </div>
            <div className="home-product-grid">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div className="home-product-card" key={`skeleton-${i}`} style={{ padding: 14 }}>
                  <Skeleton.Image active style={{ width: '100%', height: 180 }} />
                  <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 12 }} />
                </div>
              ))
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
                    <button
                      onClick={(e) => handleToggleWishlist(e, p.id, singleVariant?.id)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={wishlistedProductIds.has(p.id) ? '#ef4444' : 'none'}
                        stroke={wishlistedProductIds.has(p.id) ? '#ef4444' : '#374151'}
                        strokeWidth="2"
                      >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="home-product-info">
                    {p.category && <span className="home-product-category">{p.category.name}</span>}
                                        <h4 className="home-product-name">{p.name}</h4>
                {hasMultipleVariants && (() => {
  const uniqueColors = Array.from(
    new Set(
      p.variants
        .map((v) => {
          const key = Object.keys(v.attributes ?? {}).find(
            (k) => k.toLowerCase() === 'color'
          );
          return key ? v.attributes![key] : undefined;
        })
        .filter(Boolean)
    )
  ) as string[];
  return uniqueColors.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, margin: '4px 0' }}>
                          {uniqueColors.map((c) => (
                            <span
                              key={c}
                              title={c}
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: c.toLowerCase(),
                                border: '1px solid #d1d5db',
                              }}
                            />
                          ))}
                        </div>
                      ) : null;
                    })()}
                    {!hasMultipleVariants && singleVariant && singleVariant.stock === 0 && (
                      <Tag color="red" style={{ marginBottom: 4, width: 'fit-content' }}>
                        Out of Stock
                      </Tag>
                    )}
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
                            style={
                              !singleVariant || singleVariant.stock === 0
                                ? { background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e', cursor: 'not-allowed' }
                                : undefined
                            }
                        >
                            {!singleVariant || singleVariant.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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
                        <div style={{ width: 220, flexShrink: 0 }}>
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#f5f5f5',
                }}
              >
                {(() => {
                  const variantImages = selectedVariant?.images ?? [];
                  const displayImage = variantImages[activeImageIndex]?.imageUrl || selectedProduct.imageUrl;
                  return displayImage ? (
                    <img
                      src={displayImage}
                      alt={selectedProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : null;
                })()}
              </div>
              {(selectedVariant?.images?.length ?? 0) > 1 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {selectedVariant!.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: 44,
                        height: 44,
                        padding: 0,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: activeImageIndex === idx ? '2px solid #4C6FFF' : '1px solid #d1d5db',
                        cursor: 'pointer',
                        background: 'none',
                      }}
                    >
                      <img
                        src={img.imageUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {selectedProduct.category && (
                <span style={{ fontSize: 12, color: '#4C6FFF', fontWeight: 600, textTransform: 'uppercase' }}>
                  {selectedProduct.category.name}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>{selectedProduct.name}</h2>
                <button
                  onClick={(e) => handleToggleWishlist(e, selectedProduct.id, selectedVariant?.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={wishlistedProductIds.has(selectedProduct.id) ? '#ef4444' : 'none'}
                    stroke={wishlistedProductIds.has(selectedProduct.id) ? '#ef4444' : '#374151'}
                    strokeWidth="2"
                  >
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                  </svg>
                </button>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
                ₹{selectedVariant?.price ?? selectedProduct.price}
              </div>

              {(selectedProduct.variants?.length ?? 0) > 1 &&
                attributeKeys.map((key) => {
                  const options = optionsForKey(key);
                  if (options.length === 0) return null;
                  const isColor = key.toLowerCase() === 'color';
                  const isLastKey = attributeKeys.indexOf(key) === attributeKeys.length - 1;

                  return (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                        {key}{isColor && selectedAttributes[key] ? `: ${selectedAttributes[key]}` : ''}
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {options.map(({ value, variant }) => {
                          const isSelected = selectedAttributes[key] === value;
                          const disabled = isLastKey && variant.stock === 0;

                          if (isColor) {
                            const thumbnail = variant.images?.[0]?.imageUrl || selectedProduct.imageUrl;
                            return (
                              <button
                                key={value}
                                onClick={() => handleAttributeSelect(key, value)}
                                title={value}
                                style={{
                                  width: 48,
                                  height: 48,
                                  padding: 0,
                                  borderRadius: 6,
                                  overflow: 'hidden',
                                  border: isSelected ? '2px solid #4C6FFF' : '1px solid #d1d5db',
                                  cursor: 'pointer',
                                  background: 'none',
                                }}
                              >
                                {thumbnail ? (
                                  <img src={thumbnail} alt={value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', background: value.toLowerCase() }} />
                                )}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={value}
                              onClick={() => handleAttributeSelect(key, value)}
                              disabled={disabled}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 6,
                                border: isSelected ? '2px solid #4C6FFF' : '1px solid #d1d5db',
                                background: isSelected ? '#eef2ff' : '#fff',
                                color: disabled ? '#9ca3af' : '#1f2937',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                textDecoration: disabled ? 'line-through' : 'none',
                              }}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {(selectedVariant?.stock ?? 0) > 0 && (
                <Tag color="green" style={{ width: 'fit-content', marginBottom: 12 }}>
                  In Stock ({selectedVariant?.stock})
                </Tag>
              )}
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
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 12,
                        ...(!selectedVariant || selectedVariant.stock === 0
                        ? { background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e', cursor: 'not-allowed' }
                        : {}),
                    }}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    onClick={() => {
                    if (!selectedVariant) return;
                    handleAddToCart(selectedVariant.id, selectedQty);
                    setSelectedProduct(null);
                    }}
                >
                    {!selectedVariant || selectedVariant.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}