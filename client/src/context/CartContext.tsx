import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import customerAxios from '../api/customerAxios';

export interface CartItem {
  id: number;
  variantId: number;
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  qty: number;
  stock: number;
  attributes: Record<string, string> | null;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (variantId: number, qty: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  updateQty: (variantId: number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Shape returned by the backend: { id, customerId, items: [{ id, variant: { ..., product: {...} }, quantity }] }
function mapCartResponse(data: any): CartItem[] {
  return (data.items || []).map((i: any) => ({
    id: i.id,
    variantId: i.variant.id,
    productId: i.variant.product.id,
    name: i.variant.product.name,
    price: i.variant.price ?? i.variant.product.price,
    imageUrl: i.variant.images?.[0]?.imageUrl || i.variant.product.imageUrl,
    qty: i.quantity,
    stock: i.variant.stock,
    attributes: i.variant.attributes ?? null,
  }));
}

function isLoggedIn(): boolean {
  return !!localStorage.getItem('customer_access_token');
}

// Touches a localStorage key so other open tabs' `storage` event fires and they can refresh their cart
function broadcastCartUpdate() {
  localStorage.setItem('cart_updated_at', Date.now().toString());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn()) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await customerAxios.get('/cart');
      setItems(mapCartResponse(res.data));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Cross-tab sync: when another tab updates the cart, this tab's `storage` event fires
  // (storage events don't fire in the same tab that made the change, only other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart_updated_at') {
        refreshCart();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshCart]);

  const addToCart = async (variantId: number, qty: number) => {
    if (!isLoggedIn()) return; // guarded in UI too, safety net here
    const res = await customerAxios.post('/cart/items', { variantId, quantity: qty });
    setItems(mapCartResponse(res.data));
    broadcastCartUpdate();
  };

  const removeFromCart = async (variantId: number) => {
    const item = items.find((i) => i.variantId === variantId);
    if (!item) return;
    const res = await customerAxios.delete(`/cart/items/${item.id}`);
    setItems(mapCartResponse(res.data));
    broadcastCartUpdate();
  };

  const updateQty = async (variantId: number, qty: number) => {
    const item = items.find((i) => i.variantId === variantId);
    if (!item) return;
    if (qty <= 0) {
      await removeFromCart(variantId);
      return;
    }
    const res = await customerAxios.patch(`/cart/items/${item.id}`, { quantity: qty });
    setItems(mapCartResponse(res.data));
    broadcastCartUpdate();
  };

  const clearCart = async () => {
    await customerAxios.delete('/cart');
    setItems([]);
    broadcastCartUpdate();
  };

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, loading, addToCart, removeFromCart, updateQty, clearCart, refreshCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}