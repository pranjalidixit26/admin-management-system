import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import customerAxios from '../api/customerAxios';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  qty: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: number, qty: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQty: (productId: number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Shape returned by the backend: { id, customerId, items: [{ id, product: {...}, quantity }] }
function mapCartResponse(data: any): CartItem[] {
  return (data.items || []).map((i: any) => ({
    id: i.id,
    productId: i.product.id,
    name: i.product.name,
    price: i.product.price,
    imageUrl: i.product.imageUrl,
    qty: i.quantity,
    stock: i.product.stock,
  }));
}

function isLoggedIn(): boolean {
  return !!localStorage.getItem('customer_access_token');
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

  const addToCart = async (productId: number, qty: number) => {
    if (!isLoggedIn()) return; // guarded in UI too, safety net here
    const res = await customerAxios.post('/cart/items', { productId, quantity: qty });
    setItems(mapCartResponse(res.data));
  };

  const removeFromCart = async (productId: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    const res = await customerAxios.delete(`/cart/items/${item.id}`);
    setItems(mapCartResponse(res.data));
  };

  const updateQty = async (productId: number, qty: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    if (qty <= 0) {
      await removeFromCart(productId);
      return;
    }
    const res = await customerAxios.patch(`/cart/items/${item.id}`, { quantity: qty });
    setItems(mapCartResponse(res.data));
  };

  const clearCart = async () => {
    await customerAxios.delete('/cart');
    setItems([]);
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