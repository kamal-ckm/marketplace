'use client';

import React, { useEffect, useState } from 'react';
import {
    ShoppingBag,
    Search,
    Filter,
    MoreVertical,
    ArrowUpRight,
    Wallet,
    IndianRupee,
    User,
    Shield
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface Order {
    id: string;
    total_amount: string;
    wallet_amount: string;
    rewards_amount: string;
    cash_amount: string;
    status: string;
    shipping_address: string;
    payment_method: string;
    beneficiary_name: string;
    created_at: string;
    user_name: string;
    user_email: string;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/orders`, {
                headers: getAuthHeaders() as HeadersInit,
            });
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = orders.filter(
        (o) =>
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.user_name.toLowerCase().includes(search.toLowerCase()) ||
            o.beneficiary_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Raleway, sans-serif' }}>
                        Order Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage customer orders and track benefit utilization.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by ID, Customer or Beneficiary..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#00A59B]/20 focus:border-[#00A59B]"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A59B]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <ShoppingBag size={48} strokeWidth={1} />
                        <p className="mt-4 text-sm font-medium">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                    <th className="px-6 py-4">Order ID & Status</th>
                                    <th className="px-6 py-4">Customer & Beneficiary</th>
                                    <th className="px-6 py-4">Financial Split</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((order) => {
                                    const wallet = parseFloat(order.wallet_amount);
                                    const rewards = parseFloat(order.rewards_amount);
                                    const cash = parseFloat(order.cash_amount);
                                    const total = parseFloat(order.total_amount);

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-slate-900">#{order.id.split('-')[0].toUpperCase()}</span>
                                                    <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{order.user_name}</span>
                                                    <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                                        <User size={12} className="text-[#00A59B]" />
                                                        <span className="text-xs">For: {order.beneficiary_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between w-32">
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                                                        <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {wallet > 0 && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold">
                                                                <Shield size={10} />
                                                                W: {formatCurrency(wallet)}
                                                            </div>
                                                        )}
                                                        {rewards > 0 && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">
                                                                <Star size={10} />
                                                                R: {rewards}
                                                            </div>
                                                        )}
                                                        {cash > 0 && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                                                                <IndianRupee size={10} />
                                                                C: {formatCurrency(cash)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600">
                                                    <div className="font-medium text-xs font-mono">{new Date(order.created_at).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 text-slate-400 hover:text-[#00A59B] transition-colors rounded-lg hover:bg-slate-100">
                                                        <ArrowUpRight size={18} />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple Star icon as it wasn't imported
function Star({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    )
}
