"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

/* ---------------- TYPES ---------------- */

export type CartItemType = "product" | "stationary";

export interface CartItem {
  id: number;
  name: string;
  image: string;
  quantity: number;
  type: CartItemType;
  price?: number;
}

interface CartContextType {
  cart: CartItem[];

  addToCart: (item: CartItem) => void;

  removeFromCart: (
    id: number,
    type?: CartItemType
  ) => void;

  updateQuantity: (
    id: number,
    quantity: number,
    type?: CartItemType
  ) => void;

  updatePrice: (
    id: number,
    price: number,
    type?: CartItemType
  ) => void;

  cartTotal: number;

  cartCount: number;
}

/* ---------------- CONTEXT ---------------- */

const CartContext =
  createContext<CartContextType | null>(null);

/* ---------------- PROVIDER ---------------- */

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  /* ---------------- ADD TO CART ---------------- */

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (p) =>
          p.id === item.id &&
          p.type === item.type
      );

      if (existing) {
        return prev.map((p) =>
          p.id === item.id &&
          p.type === item.type
            ? {
                ...p,
                quantity:
                  Number(p.quantity) + 1,
              }
            : p
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  /* ---------------- REMOVE FROM CART ---------------- */

  const removeFromCart = (
    id: number,
    type?: CartItemType
  ) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (type) {
          return !(
            item.id === id &&
            item.type === type
          );
        }

        return item.id !== id;
      })
    );
  };

  /* ---------------- UPDATE QUANTITY ---------------- */

  const updateQuantity = (
    id: number,
    quantity: number,
    type?: CartItemType
  ) => {
    if (quantity < 0.1) {
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        const matched = type
          ? item.id === id &&
            item.type === type
          : item.id === id;

        if (!matched) {
          return item;
        }

        return {
          ...item,
          quantity: Number(quantity),
        };
      })
    );
  };

  /* ---------------- UPDATE PRICE ---------------- */

  const updatePrice = (
    id: number,
    price: number,
    type?: CartItemType
  ) => {
    if (price < 0) {
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        const matched = type
          ? item.id === id &&
            item.type === type
          : item.id === id;

        if (!matched) {
          return item;
        }

        return {
          ...item,
          price: Number(price),
        };
      })
    );
  };

  /* ---------------- CART TOTAL ---------------- */

  const cartTotal = cart.reduce(
    (total, item) => {
      return (
        total +
        (Number(item.price) || 0) *
          Number(item.quantity)
      );
    },
    0
  );

  /* ---------------- CART COUNT ---------------- */

  const cartCount = cart.reduce(
    (count, item) =>
      count + Number(item.quantity),
    0
  );

  /* ---------------- PROVIDER ---------------- */

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        cartTotal,
        cartCount,
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
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}