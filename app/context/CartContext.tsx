"use client";

import { createContext, useContext, useState, ReactNode } from "react";

/* ---------------- TYPES ---------------- */

export interface CartItem {
  id: number;
  name: string;
  image: string;

  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updatePrice: (id: number, price: number) => void;
  cartTotal: number;
  cartCount: number; // ✅ added
}

/* ---------------- CONTEXT ---------------- */

const CartContext = createContext<CartContextType | null>(null);

/* ---------------- PROVIDER ---------------- */

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add Item
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);

      if (existing) {
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [...prev, { ...item, quantity: 1 || 0 }];
    });
  };

  // Remove Item
  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Update Quantity
 const updateQuantity = (id: number, quantity: number) => {
  if (quantity < 0.1) return;

  setCart((prev) =>
    prev.map((item) =>
      item.id === id ? { ...item, quantity } : item
    )
  );
};

  // Update Price
  const updatePrice = (id: number, price: number) => {
    if (price < 0) return;

    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, price } : item
      )
    );
  };

  // Total Price
  const cartTotal = cart.reduce(
    (total, item) => total  * item.quantity,
    0
  );

  // ✅ Total Items Count
  const cartCount = cart.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        cartTotal,
        cartCount, // ✅ merged
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
