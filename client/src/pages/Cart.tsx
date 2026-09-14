import { Link } from 'react-router-dom';
import { Empty, message } from 'antd';
import { useCart } from '../context/CartContext';
import NetworkBackground from '../components/NetworkBackground';
import './Home.css';

export default function Cart() {
  const { items, updateQty, removeFromCart, totalPrice, totalItems } = useCart();

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

        {items.length === 0 ? (
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
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>₹{item.price} each</div>
                  </div>

                  <div
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
                          await updateQty(item.productId, item.qty - 1);
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
                          await updateQty(item.productId, item.qty + 1);
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
                    onClick={async () => {
                      try {
                        await removeFromCart(item.productId);
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
              ))}
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
    </div>
  );
}