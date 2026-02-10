'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface User {
    id: string;
    email: string;
    name: string;
    wallet_balance: number;
    rewards_balance: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const CustomerAuthContext = createContext<AuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {\n    const [user, setUser] = useState<User | null>(null);\n    const [token, setToken] = useState<string | null>(null);\n    const [isLoading, setIsLoading] = useState(true);\n\n    useEffect(() => {\n        const savedToken = localStorage.getItem('customer_token');\n        const savedUser = localStorage.getItem('customer_user');\n\n        if (savedToken && savedUser) {\n            setToken(savedToken);\n            setUser(JSON.parse(savedUser));\n        }\n        setIsLoading(false);\n    }, []);\n\n    const login = async (email: string, password: string) => {\n        try {\n            const res = await fetch(`${API_BASE}/api/auth/customer/login`, {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ email, password }),\n            });\n            const data = await res.json();\n\n            if (res.ok) {\n                setToken(data.token);\n                setUser(data.user);\n                localStorage.setItem('customer_token', data.token);\n                localStorage.setItem('customer_user', JSON.stringify(data.user));\n                return { success: true };\n            }\n            return { success: false, error: data.error };\n        } catch (err) {\n            return { success: false, error: 'Network error' };\n        }\n    };\n\n    const register = async (name: string, email: string, password: string) => {\n        try {\n            const res = await fetch(`${API_BASE}/api/auth/customer/register`, {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ name, email, password }),\n            });\n            const data = await res.json();\n\n            if (res.ok) {\n                setToken(data.token);\n                setUser(data.user);\n                localStorage.setItem('customer_token', data.token);\n                localStorage.setItem('customer_user', JSON.stringify(data.user));\n                return { success: true };\n            }\n            return { success: false, error: data.error };\n        } catch (err) {\n            return { success: false, error: 'Network error' };\n        }\n    };\n\n    const logout = () => {\n        setToken(null);\n        setUser(null);\n        localStorage.removeItem('customer_token');\n        localStorage.removeItem('customer_user');\n    };\n\n    return (\n        <CustomerAuthContext.Provider\n            value={{ user, token, isAuthenticated: !!token, isLoading, login, register, logout }}\n        >\n            {children}\n        </CustomerAuthContext.Provider>\n    );\n}\n\nexport const useCustomerAuth = () => {\n    const context = useContext(CustomerAuthContext);\n    if (!context) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');\n    return context;\n};\n\nexport const getCustomerAuthHeaders = () => {\n    if (typeof window === 'undefined') return {};\n    const token = localStorage.getItem('customer_token');\n    return token ? { 'Authorization': `Bearer ${token}` } : {};\n};\n