'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CatalogImage } from '@/data/catalog';
import { DEFAULT_PRICING, getEffectiveUnitPrice } from '@/config/pricing';

export interface CartItem {
  id: number;
  alt: string;
  src: string;
  category: string;
  subcategory: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalUnits: number;
  isWholesale: boolean;
  effectiveUnitPriceUSD: number;
  subtotalUSD: number;
  unitsRemainingForWholesale: number;
  addItem: (image: CatalogImage, qty?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: number) => number;
}

const STORAGE_KEY = 'yp_modas_cart_v1';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever items change after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items, hydrated]);

  const addItem = useCallback((image: CatalogImage, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === image.id);
      if (existing) {
        return prev.map((item) =>
          item.id === image.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: image.id,
          alt: image.alt,
          src: image.src,
          category: image.category,
          subcategory: image.subcategory,
          quantity: qty,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (id: number) => items.find((item) => item.id === id)?.quantity || 0,
    [items]
  );

  const metrics = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const { unitPriceUSD, isWholesale } = getEffectiveUnitPrice(totalUnits, DEFAULT_PRICING);
    const subtotalUSD = totalUnits * unitPriceUSD;
    const unitsRemainingForWholesale = Math.max(
      0,
      DEFAULT_PRICING.wholesaleMinUnits - totalUnits
    );

    return {
      totalUnits,
      isWholesale,
      effectiveUnitPriceUSD: unitPriceUSD,
      subtotalUSD,
      unitsRemainingForWholesale,
    };
  }, [items]);

  const value: CartContextValue = {
    items,
    ...metrics,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

