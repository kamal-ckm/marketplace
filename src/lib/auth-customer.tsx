'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface CustomerUser {
    id: string;
    email: string;
    name: string;
    wallet_balance: number;
    rewards_balance: number;
    employer_name: string | null;
}

interface CustomerAuthContextType {
    user: CustomerUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => ({ success: false }),
    register: async () => ({ success: false }),
    logout: () => { },
    refreshUser: async () => { },
});

export function useCustomerAuth() {
    return useContext(CustomerAuthContext);
}

export function getCustomerAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('healthi_customer_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<CustomerUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('healthi_customer_token');
        if (storedToken) {
            validateToken(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    async function validateToken(t: string) {
        try {
            const res = await fetch(`${API_BASE}/api/auth/customer/me`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
                setToken(t);
            } else {
                localStorage.removeItem('healthi_customer_token');
            }
        } catch {
            localStorage.removeItem('healthi_customer_token');
        } finally {
            setIsLoading(false);
        }
    }

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/customer/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Login failed' };
            }

            localStorage.setItem('healthi_customer_token', data.token);
            setToken(data.token);
            setUser(data.user);

            return { success: true };
        } catch {
            return { success: false, error: 'Network error.' };
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/customer/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Registration failed' };
            }

            localStorage.setItem('healthi_customer_token', data.token);
            setToken(data.token);
            setUser(data.user);

            return { success: true };
        } catch {
            return { success: false, error: 'Network error.' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('healthi_customer_token');
        setToken(null);
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const t = token || localStorage.getItem('healthi_customer_token');
        if (t) await validateToken(t);
    }, [token]);

    return (
        <CustomerAuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user && !!token,
                isLoading,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </CustomerAuthContext.Provider>
    );
}
