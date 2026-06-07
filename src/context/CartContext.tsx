"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { MenuItem } from "@/data/menuData";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch { }
    }
  }, []);

  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  }, []);

  const addItem = useCallback((item: MenuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      } else {
        next = [...prev, { item, quantity }];
      }
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((ci) => ci.item.id !== itemId);
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(itemId); return; }
    setItems((prev) => {
      const next = prev.map((ci) =>
        ci.item.id === itemId ? { ...ci, quantity } : ci
      );
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem("cart");
  }, []);

  const totalItems = useMemo(() => items.reduce((s, ci) => s + ci.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, ci) => s + ci.item.price * ci.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
