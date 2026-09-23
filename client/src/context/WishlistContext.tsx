import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import customerAxios from '../api/customerAxios';

export interface WishlistItem {
  productId: number;
  variantId: number | null;
  name: string;
  categoryName: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  wishlistedProductIds: Set<number>;
  addToWishlist: (productId: number, variantId?: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function isLoggedIn(): boolean {
  return !!localStorage.getItem('customer_access_token');
}

function broadcastWishlistUpdate() {
  localStorage.setItem('wishlist_updated_at', Date.now().toString());
}

// Shape returned by backend: { id, product: { id, name, price, imageUrl, variants }, variant: { id, price, stock, images } | null }
function mapWishlistResponse(data: any[]): WishlistItem[] {
  return (data || []).map((i: any) => {
    const variant = i.variant;
    const stock = variant
      ? variant.stock
      : (i.product.variants || []).reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    return {
      productId: i.product.id,
      variantId: variant?.id ?? null,
      name: i.product.name,
      categoryName: i.product.category?.name ?? null,
      imageUrl: variant?.images?.[0]?.imageUrl || i.product.imageUrl,
      price: variant?.price ?? i.product.price,
      stock,
    };
  });
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn()) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await customerAxios.get('/wishlist');
      setItems(mapWishlistResponse(res.data));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wishlist_updated_at') {
        refreshWishlist();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshWishlist]);

  const addToWishlist = async (productId: number, variantId?: number) => {
    if (!isLoggedIn()) return;
    await customerAxios.post(`/wishlist/${productId}`, variantId ? { variantId } : {});
    await refreshWishlist();
    broadcastWishlistUpdate();
  };

  const removeFromWishlist = async (productId: number) => {
    await customerAxios.delete(`/wishlist/${productId}`);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    broadcastWishlistUpdate();
  };

  const wishlistedProductIds = new Set(items.map((i) => i.productId));

  return (
    <WishlistContext.Provider
      value={{ items, loading, wishlistedProductIds, addToWishlist, removeFromWishlist, refreshWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}