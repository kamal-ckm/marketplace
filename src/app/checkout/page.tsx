'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useCustomerAuth, getCustomerAuthHeaders } from '@/lib/auth-customer';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Loader2, ArrowRight, User, MapPin, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, summary, loading: cartLoading, refreshCart } = useCart();
    const { user, isAuthenticated, isLoading: authLoading } = useCustomerAuth();

    const [address, setAddress] = useState('');
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/checkout');
        }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading || cartLoading || !user) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-[#00A59B]" />
            </div>
        );
    }

    async function handlePlaceOrder() {
        if (!address.trim()) {
            setError('Please enter a shipping address.');
            return;
        }

        setPlacing(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE}/api/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCustomerAuthHeaders(),
                },
                body: JSON.stringify({ shippingAddress: address }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to place order.');
                setPlacing(false);
                return;
            }

            // Success! Refresh cart (to empty it) and redirect
            await refreshCart();
            router.push(`/orders/${data.orderId}`);

        } catch (err) {
            setError('Network error. Please try again.');
            setPlacing(false);
        }
    }

    if (cartLoading || !user) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-[#00A59B]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Raleway' }}>
                    Checkout
                </h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Form */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Customer Info */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                                <User size={20} className="text-[#00A59B]" />
                                Customer Details
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                    <input type="text" value={user.name} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="text" value={user.email} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Shipping Address */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                                <MapPin size={20} className="text-[#00A59B]" />
                                Shipping Address
                            </h2>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter your full shipping address..."
                                rows={3}
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A59B] focus:border-[#00A59B] outline-none transition-all"
                            />
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>

                        {/* 3. Payment Method */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 opacity-60">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-2">
                                Payment Method
                            </h2>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="w-4 h-4 bg-[#00A59B] rounded-full" />
                                <span className="font-medium text-slate-700">Cash / Pay on Delivery</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 pl-1">
                                Only COD available for MVP. Wallet integration coming soon.
                            </p>
                        </div>

                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 sticky top-24">
                            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>

                            <div className="max-h-60 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div className="flex-1 pr-2">
                                            <span className="text-slate-700 font-medium">{item.name}</span>
                                            <span className="text-slate-400 block text-xs">Qty: {item.quantity}</span>
                                        </div>
                                        <span className="font-medium text-slate-900 text-right w-20">
                                            {formatCurrency(parseFloat(item.price) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-100 pt-4 space-y-2 mb-6">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(summary.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Delivery</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-lg text-slate-900">
                                    <span>Total</span>
                                    <span>{formatCurrency(summary.totalAmount)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={placing}
                                className="w-full flex items-center justify-center gap-2 bg-[#00A59B] hover:bg-[#008C84] text-white py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-[#00A59B]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {placing ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                                {placing ? 'Placing Order...' : 'Confirm Order'}
                            </button>

                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
                                <Truck size={12} />
                                <span>Estimated delivery: 3-5 days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
