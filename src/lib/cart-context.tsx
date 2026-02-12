'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCustomerAuth, getCustomerAuthHeaders } from './auth-customer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface CartItem {
    id: string; // cart_item_id
    product_id: string;
    name: string;
    price: string;
    mrp: string;
    quantity: number;
    images: string[];
    total_price: number;
    wallet_eligible: boolean;
    rewards_eligible: boolean;
}

interface CartSummary {
    totalAmount: number;
    totalItems: number;
}

interface CartContextType {
    items: CartItem[];
    summary: CartSummary;
    loading: boolean;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    refreshCart: () => Promise<void>;
    addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
    removeFromCart: (itemId: string) => Promise<{ success: boolean; error?: string }>;
    updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
}

const CartContext = createContext<CartContextType>({
    items: [],
    summary: { totalAmount: 0, totalItems: 0 },
    loading: false,
    isCartOpen: false,
    setIsCartOpen: () => { },
    refreshCart: async () => { },
    addToCart: async () => ({ success: false }),
    removeFromCart: async () => ({ success: false }),
    updateQuantity: async () => ({ success: false }),
});

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, token } = useCustomerAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [summary, setSummary] = useState<CartSummary>({ totalAmount: 0, totalItems: 0 });
    const [loading, setLoading] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setItems([]);
            setSummary({ totalAmount: 0, totalItems: 0 });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/cart`, {
                headers: getCustomerAuthHeaders(),
            });

            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
                setSummary(data.summary || { totalAmount: 0, totalItems: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch cart', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    // Initial fetch
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = useCallback(async (productId: string, quantity = 1) => {
        if (!isAuthenticated) return { success: false, error: 'Please login first.' };

        try {
            const res = await fetch(`${API_BASE}/api/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCustomerAuthHeaders()
                },
                body: JSON.stringify({ productId, quantity }),
            });

            if (!res.ok) {
                const err = await res.json();
                return { success: false, error: err.error || 'Failed to add item' };
            }

            await refreshCart();
            return { success: true };
        } catch {
            return { success: false, error: 'Network error' };
        }
    }, [isAuthenticated, refreshCart]);

    const removeFromCart = useCallback(async (itemId: string) => {
        if (!isAuthenticated) return { success: false, error: 'Please login first.' };

        try {
            const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: getCustomerAuthHeaders(),
            });

            if (!res.ok) return { success: false, error: 'Failed to remove item' };

            await refreshCart();
            return { success: true };
        } catch {
            return { success: false, error: 'Network error' };
        }
    }, [isAuthenticated, refreshCart]);

    const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
        if (!isAuthenticated) return { success: false, error: 'Please login first.' };

        try {
            const res = await fetch(`${API_BASE}/api/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCustomerAuthHeaders()
                },
                body: JSON.stringify({ quantity }),
            });

            if (!res.ok) return { success: false, error: 'Failed to update quantity' };

            await refreshCart();
            return { success: true };
        } catch {
            return { success: false, error: 'Network error' };
        }
    }, [isAuthenticated, refreshCart]);

    return (
        <CartContext.Provider
            value={{
                items,
                summary,
                loading,
                isCartOpen,
                setIsCartOpen,
                refreshCart,
                addToCart,
                removeFromCart,
                updateQuantity,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
