import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Client-side cart. The backend has no cart table (`carts`,
 * `applied_promos`, `promo_codes` are a documented backend gap), so the cart
 * lives here only.
 *
 * Each item carries the listing `pid` the backend needs for
 * `POST /api/orders` (`orders.create(listingPid, quantity)`) plus the
 * server-sent `price_display` string — never recompute money client-side.
 */
export interface CartItem {
  /** Listing pid (UUID) — used as `listing_pid` in `orders.create`. */
  pid: string;
  /** Same as pid, kept so existing `item.id` call sites keep working. */
  id: string;
  name: string;
  /** Server-sent display string, e.g. "₦1500.05". */
  priceDisplay: string;
  image: string;
  quantity: number;
  seller: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  /** Number of line items (distinct listings). */
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    const key = item.pid || item.id;
    const normalized = { ...item, pid: key, id: key };
    setItems((prev) => {
      const existing = prev.find((i) => i.pid === normalized.pid);
      if (existing)
        return prev.map((i) =>
          i.pid === normalized.pid ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...normalized, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) =>
    setItems((prev) => prev.filter((i) => i.pid !== id && i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(id);
    setItems((prev) =>
      prev.map((i) => (i.pid === id || i.id === id ? { ...i, quantity } : i)),
    );
  };

  const clearCart = () => setItems([]);
  const total = items.length;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
