"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Product, BookingDetails, Addon } from "@/types/product";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, qty: number, startDate?: string, endDate?: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalDays: () => number;
  toggleAddon: (productId: number, addon: Addon) => void;
  currentBooking: BookingDetails | null;
  setCurrentBooking: (booking: BookingDetails) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: any) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Helper to get current userId from localStorage safely
  const getUserId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userId");
    }
    return null;
  };

  // Load cart from localStorage on mount and when userId changes
  useEffect(() => {
    const currentId = getUserId();
    setUserId(currentId);
    
    const key = currentId ? `rental_cart_${currentId}` : "rental_cart_guest";
    const savedCart = localStorage.getItem(key);
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to parse saved cart", err);
        setCart([]);
      }
    } else {
      setCart([]); // Clear if no cart for this user
    }
    setIsLoaded(true);
  }, []);

  // Watch for userId changes in localStorage (e.g. login/logout)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentId = getUserId();
      if (currentId !== userId) {
        setUserId(currentId);
        const key = currentId ? `rental_cart_${currentId}` : "rental_cart_guest";
        const savedCart = localStorage.getItem(key);
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (err) {
            setCart([]);
          }
        } else {
          setCart([]);
        }
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, [userId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const key = userId ? `rental_cart_${userId}` : "rental_cart_guest";
      localStorage.setItem(key, JSON.stringify(cart));
    }
  }, [cart, isLoaded, userId]);

  const addToCart = (product: Product, qty: number, startDate?: string, endDate?: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty, start_date: startDate, end_date: endDate }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleAddon = (productId: number, addon: Addon) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const addons = item.selectedAddons || [];
          const exists = addons.find((a) => a.id === addon.id);
          const newAddons = exists
            ? addons.filter((a) => a.id !== addon.id)
            : [...addons, addon];
          return { ...item, selectedAddons: newAddons };
        }
        return item;
      })
    );
  };

  // Calculate rental days for a single cart item
  const getItemDays = (item: CartItem): number => {
    if (!item.start_date || !item.end_date) return 1;
    const start = new Date(item.start_date);
    const end = new Date(item.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days < 1 ? 1 : days;
  };

  // Total = price_per_day × quantity × days  (e.g. $30 × 5 chairs × 3 days = $450)
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const days = getItemDays(item);
      const productTotal = item.price_per_day * item.quantity * days;
      const addonsTotal = (item.selectedAddons || []).reduce(
        (acc, addon) => acc + addon.price * item.quantity * days,
        0
      );
      return total + productTotal + addonsTotal;
    }, 0);
  };

  const getTotalDays = () => {
    if (cart.length === 0) return 0;
    const item = cart[0];
    return getItemDays(item);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalDays,
        toggleAddon,
        currentBooking,
        setCurrentBooking,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext)!;