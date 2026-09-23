import { Link } from 'react-router-dom';
import { Empty, message, Spin, Tag } from 'antd';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import NetworkBackground from '../components/NetworkBackground';
import './Home.css';

export default function Wishlist() {
  const { items, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = async (productId: number, variantId: number | null, stock: number) => {
    if (!variantId) {
      message.warning('This product has no purchasable variant right now');
      return;
    }
    if (stock === 0) {
      message.warning('This item is currently out of stock');
      return;
    }
    try {
      await addToCart(variantId, 1);
      await removeFromWishlist(productId);
      message.success('Moved to cart');
    } catch {
      message.error('Could not move item to cart');
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
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/cart" className="home-nav-login">My Cart</Link>
          <Link to="/" className="home-nav-login">Continue Shopping</Link>
        </div>
      </nav>

      <main className="home-main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginBottom: 24 }}>Your Wishlist</h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '60px auto' }}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description="Your wishlist is empty" style={{ margin: '60px auto' }}>
            <Link to="/" className="home-nav-login">Continue Shopping</Link>
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: '#fff',
                  borderRadius: 10,
                  padding: 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
                  {item.categoryName && (
                    <div style={{ fontSize: 12, color: '#4C6FFF', fontWeight: 600, textTransform: 'uppercase' }}>
                      {item.categoryName}
                    </div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>₹{item.price}</div>
                  {item.stock === 0 && (
                    <Tag color="red" style={{ marginTop: 4, width: 'fit-content' }}>
                      Out of Stock
                    </Tag>
                  )}
                </div>

                <button
                  className="home-add-to-cart"
                  disabled={item.stock === 0}
                  onClick={() => handleMoveToCart(item.productId, (item as any).variantId ?? null, item.stock)}
                  style={
                    item.stock === 0
                      ? { background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e', cursor: 'not-allowed' }
                      : undefined
                  }
                >
                  {item.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                </button>

                <button
                  onClick={() => removeFromWishlist(item.productId)}
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}