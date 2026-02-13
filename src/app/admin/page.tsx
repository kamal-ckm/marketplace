'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    ShoppingBag,
    Wallet,
    TrendingUp,
    Clock,
    ArrowUpRight,
    IndianRupee,
    Gift
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface DashboardStats {
    metrics: {
        totalRevenue: number;
        totalOrders: number;
        walletUtilization: number;
        rewardsUtilization: number;
    };
    recentOrders: Array<{
        id: string;
        total_amount: string;
        status: string;
        created_at: string;
        user_name: string;
    }>;
    trends: Array<{
        day: string;
        amount: string;
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/stats`, {
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A59B]" />
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(stats?.metrics.totalRevenue || 0),
            icon: IndianRupee,
            color: 'bg-blue-500',
            trend: '+12% from last month'
        },
        {
            title: 'Total Orders',
            value: stats?.metrics.totalOrders || 0,
            icon: ShoppingBag,
            color: 'bg-emerald-500',
            trend: '+5% this week'
        },
        {
            title: 'Wallet Utilization',
            value: formatCurrency(stats?.metrics.walletUtilization || 0),
            icon: Wallet,
            color: 'bg-[#00A59B]',
            trend: 'High engagement'
        },
        {
            title: 'Rewards Redeemed',
            value: `${stats?.metrics.rewardsUtilization || 0} pts`,
            icon: Gift,
            color: 'bg-amber-500',
            trend: 'Trending up'
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Raleway, sans-serif' }}>
                    Dashboard Overview
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Real-time monitoring of marketplace health and benefit utilization.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl text-white ${card.color}`}>
                                <card.icon size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-500">{card.title}</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                        <div className="flex items-center gap-1 mt-4 text-xs font-medium text-emerald-600">
                            <TrendingUp size={12} />
                            <span>{card.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Clock size={18} className="text-slate-400" />
                            Recent Orders
                        </h2>
                        <Link href="/admin/orders" className="text-xs font-bold text-[#00A59B] hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats?.recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900">{order.user_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {formatCurrency(parseFloat(order.total_amount))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-[#00A59B] transition-colors">
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Widget: Active Benefits */}
                <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-lg font-bold mb-2">Benefit Insights</h2>
                        <p className="text-slate-400 text-xs mb-6">Engagement with employer-sponsored plans.</p>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-400">Wallet Adoption</span>
                                    <span className="text-emerald-400">84%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[84%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-400">Rewards Redemption</span>
                                    <span className="text-amber-400">62%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 w-[62%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-400">Healthi Usage</span>
                                    <span className="text-blue-400">45%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[45%]" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4 text-center">Top Performing Plan</p>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-sm font-bold text-[#00A59B]">Corporate Wellness 2026</p>
                                <p className="text-xs text-slate-400 mt-1">₹4.2L Volume</p>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Gradient */}
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#00A59B]/20 rounded-full blur-3xl" />
                </div>
            </div>
        </div>
    );
}
