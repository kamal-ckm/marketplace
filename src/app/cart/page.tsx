'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
    const router = useRouter();
    const { items, summary, loading, updateQuantity, removeFromCart } = useCart();
    const [updating, setUpdating] = useState<string | null>(null);

    async function handleUpdateQty(itemId: string, newQty: number) {
        if (newQty < 1) return;
        setUpdating(itemId);
        await updateQuantity(itemId, newQty);
        setUpdating(null);
    }

    async function handleRemove(itemId: string) {
        setUpdating(itemId);
        await removeFromCart(itemId);
        setUpdating(null);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Raleway' }}>
                    Shopping Cart
                </h1>

                {loading && items.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-[#00A59B]" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCart size={40} className="text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                        <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-[#00A59B] hover:bg-[#008C84] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                                    {/* Image */}
                                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-100">
                                        {item.images && item.images[0] ? (
                                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <ShoppingCart size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 mb-1">{item.name}</h3>
                                                <p className="text-[#00A59B] font-bold">{formatCurrency(parseFloat(item.price))}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                disabled={updating === item.id}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center border border-slate-200 rounded-lg">
                                                <button
                                                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                                    disabled={updating === item.id || item.quantity <= 1}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                                    disabled={updating === item.id}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            {updating === item.id && <Loader2 size={16} className="animate-spin text-[#00A59B]" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 sticky top-24">
                                <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal ({summary.totalItems} items)</span>
                                        <span>{formatCurrency(summary.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Delivery</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                                        <span>Total</span>
                                        <span>{formatCurrency(summary.totalAmount)}</span>
                                    </div>
                                </div>

                                <Link href="/checkout" className="block w-full">
                                    <button className="w-full flex items-center justify-center gap-2 bg-[#00A59B] hover:bg-[#008C84] text-white py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-[#00A59B]/20">
                                        Proceed to Checkout
                                        <ArrowRight size={18} />
                                    </button>
                                </Link>

                                <p className="text-xs text-center text-slate-400 mt-4">
                                    Secure Checkout • 100% Tax Free
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
