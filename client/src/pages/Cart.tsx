import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, message, Spin, Modal, Tag } from 'antd';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import NetworkBackground from '../components/NetworkBackground';
import './Home.css';

interface ProductVariantDetail {
  id: number;
  attributes: Record<string, string> | null;
  stock: number;
  price: number | null;
  images: { id: number; imageUrl: string }[];
}

interface ProductDetail {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: { id: number; name: string } | null;
  variants: ProductVariantDetail[];
}

export default function Cart() {
  const { items, updateQty, removeFromCart, addToCart, totalPrice, totalItems, loading } = useCart();

  const [modalProduct, setModalProduct] = useState<ProductDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // The cart line item this modal was opened for
  const [originalVariantId, setOriginalVariantId] = useState<number | null>(null);
  const [originalQty, setOriginalQty] = useState<number>(1);

  // In-modal variant selection state (for switching)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [switching, setSwitching] = useState(false);

  const openItemModal = async (productId: number, variantId: number, qty: number) => {
    setModalLoading(true);
    setActiveImageIndex(0);
    setOriginalVariantId(variantId);
    setOriginalQty(qty);
    try {
      const res = await axios.get(`http://localhost:3000/products/public/${productId}`);
      const product: ProductDetail = res.data;
      setModalProduct(product);
      const current = product.variants.find((v) => v.id === variantId);
      setSelectedAttributes(current?.attributes ? { ...current.attributes } : {});
    } catch {
      message.error('Could not load product details');
      return;
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalProduct(null);
    setOriginalVariantId(null);
    setSelectedAttributes({});
  };

  // Ordered list of distinct attribute keys across this product's variants, Color first
  const attributeKeys = modalProduct
    ? (() => {
        const keysSet = new Set<string>();
        modalProduct.variants.forEach((v) => {
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

  // The variant matching every currently selected attribute value
  const selectedVariant =
    modalProduct?.variants.find((v) =>
      attributeKeys.every((key) => (v.attributes?.[key] ?? '') === (selectedAttributes[key] ?? '')),
    ) ?? null;

  const variantsMatchingPriorSelections = (key: string) => {
    if (!modalProduct) return [];
    const priorKeys = attributeKeys.slice(0, attributeKeys.indexOf(key));
    return modalProduct.variants.filter((v) =>
      priorKeys.every((k) => (v.attributes?.[k] ?? '') === (selectedAttributes[k] ?? '')),
    );
  };

  const optionsForKey = (key: string) => {
    const candidates = variantsMatchingPriorSelections(key);
    const seen = new Map<string, ProductVariantDetail>();
    candidates.forEach((v) => {
      const val = v.attributes?.[key];
      if (val && !seen.has(val)) seen.set(val, v);
    });
    return Array.from(seen.entries()).map(([value, variant]) => ({ value, variant }));
  };

  const handleAttributeSelect = (key: string, value: string) => {
    if (!modalProduct) return;
    setSelectedAttributes((prev) => {
      const next = { ...prev, [key]: value };
      const keyIndex = attributeKeys.indexOf(key);
      for (let i = keyIndex + 1; i < attributeKeys.length; i++) {
        const laterKey = attributeKeys[i];
        const stillValid = modalProduct.variants.some((v) =>
          attributeKeys.slice(0, i + 1).every((k) => (v.attributes?.[k] ?? '') === (next[k] ?? '')),
        );
        if (!stillValid) {
          const fallback = modalProduct.variants.find((v) =>
            attributeKeys.slice(0, i).every((k) => (v.attributes?.[k] ?? '') === (next[k] ?? '')),
          );
          if (fallback?.attributes?.[laterKey]) {
            next[laterKey] = fallback.attributes[laterKey];
          }
        }
      }
      return next;
    });
  };

  const hasChanged = selectedVariant !== null && selectedVariant.id !== originalVariantId;

  const handleUpdateCart = async () => {
    if (!selectedVariant || !originalVariantId || !hasChanged) return;
    setSwitching(true);
    try {
      const qtyToCarry = Math.min(originalQty, selectedVariant.stock);
      await removeFromCart(originalVariantId);
      await addToCart(selectedVariant.id, qtyToCarry);
      message.success('Cart updated');
      closeModal();
    } catch {
      message.error('Could not switch variant — please try again');
    } finally {
      setSwitching(false);
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
        <Link to="/" className="home-nav-login">Continue Shopping</Link>
      </nav>

      <main className="home-main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginBottom: 24 }}>Your Cart</h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '60px auto' }}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description="Your cart is empty" style={{ margin: '60px auto' }}>
            <Link to="/" className="home-nav-login">Continue Shopping</Link>
          </Empty>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            {/* Left: item list */}
            <div style={{ flex: '1 1 560px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item) => {
                const variantParts = Object.entries(item.attributes ?? {}).map(
                  ([key, value]) => `${key}: ${value}`
                );
                return (
                <div
                  key={item.variantId}
                  onClick={() => openItemModal(item.productId, item.variantId, item.qty)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    background: '#fff',
                    borderRadius: 10,
                    padding: 16,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      flexShrink: 0,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#f5f5f5',
                    }}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                    {variantParts.length > 0 && (
                      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                        {variantParts.join(' / ')}
                      </div>
                    )}
                    <div style={{ color: '#6b7280', fontSize: 13 }}>₹{item.price} each</div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                                        <button
                      onClick={async () => {
                        try {
                          await updateQty(item.variantId, item.qty - 1);
                        } catch {
                          message.error('Could not update quantity');
                        }
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        background: '#f3f4f6',
                        fontSize: 15,
                        cursor: 'pointer',
                      }}
                    >
                      −
                    </button>
                    <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
                      {item.qty}
                    </span>
                                        <button
                      onClick={async () => {
                        try {
                          await updateQty(item.variantId, item.qty + 1);
                        } catch {
                          message.error('Cannot add more — stock limit reached');
                        }
                      }}
                      disabled={item.qty >= item.stock}
                      style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        background: '#f3f4f6',
                        fontSize: 15,
                        cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ width: 70, textAlign: 'right', fontWeight: 600, flexShrink: 0 }}>
                    ₹{item.price * item.qty}
                  </div>

                                    <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await removeFromCart(item.variantId);
                      } catch {
                        message.error('Could not remove item');
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
                );
              })}
            </div>

            {/* Right: sticky order summary */}
            <div
              style={{
                flex: '0 1 300px',
                minWidth: 260,
                background: '#fff',
                borderRadius: 10,
                padding: 24,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                position: 'sticky',
                top: 24,
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Order Summary</h3>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  color: '#6b7280',
                  marginBottom: 8,
                }}
              >
                <span>Items ({totalItems})</span>
                <span>₹{totalPrice}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  color: '#6b7280',
                  marginBottom: 16,
                }}
              >
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div
                style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: 16,
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                <span>Total</span>
                <span>₹{totalPrice}</span>
              </div>

              <button
                className="home-add-to-cart"
                style={{ width: '100%', padding: '10px 0', fontSize: 15 }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Product detail modal — now supports switching the cart line item's variant */}
      <Modal
        open={modalProduct !== null || modalLoading}
        onCancel={closeModal}
        footer={null}
        width={640}
        centered
      >
        {modalLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : modalProduct ? (
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
                  const displayImage = variantImages[activeImageIndex]?.imageUrl || modalProduct.imageUrl;
                  return displayImage ? (
                    <img
                      src={displayImage}
                      alt={modalProduct.name}
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
              {modalProduct.category && (
                <span style={{ fontSize: 12, color: '#4C6FFF', fontWeight: 600, textTransform: 'uppercase' }}>
                  {modalProduct.category.name}
                </span>
              )}
              <h2 style={{ margin: '6px 0', fontSize: 22 }}>{modalProduct.name}</h2>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
                ₹{selectedVariant?.price ?? modalProduct.price}
              </div>

              {attributeKeys.map((key) => {
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
                          const thumbnail = variant.images?.[0]?.imageUrl || modalProduct.imageUrl;
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

              {selectedVariant && (
                <Tag
                  color={selectedVariant.stock > 0 ? 'green' : 'red'}
                  style={{ width: 'fit-content', marginBottom: 12 }}
                >
                  {selectedVariant.stock > 0 ? `In Stock (${selectedVariant.stock})` : 'Out of Stock'}
                </Tag>
              )}

              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, flex: 1 }}>
                {modalProduct.description || 'No description available.'}
              </p>

              {hasChanged && (
                <button
                  className="home-add-to-cart"
                  disabled={switching || !selectedVariant || selectedVariant.stock === 0}
                  onClick={handleUpdateCart}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 8,
                    ...(switching || !selectedVariant || selectedVariant.stock === 0
                      ? { opacity: 0.6, cursor: 'not-allowed' }
                      : {}),
                  }}
                >
                  {switching ? 'Updating...' : 'Update Cart'}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}