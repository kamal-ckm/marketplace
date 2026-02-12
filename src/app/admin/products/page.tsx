'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Package } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: string;
    mrp: string;
    stock_quantity: number;
    images: string[];
    category: string;
    status: string;
    created_at: string;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/products`, {
                headers: getAuthHeaders() as HeadersInit,
            });
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase())
    );

    function formatPrice(price: string) {
        return `₹${parseFloat(price).toLocaleString('en-IN')}`;
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Raleway, sans-serif' }}>
                        Products
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {products.length} total product{products.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 bg-[#00A59B] hover:bg-[#008C84] text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-slate-200 mb-6">
                <div className="px-4 py-3 flex items-center gap-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        id="admin-product-search"
                        type="text"
                        placeholder="Search by name or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A59B]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Package size={48} strokeWidth={1} />
                        <p className="mt-4 text-sm font-medium">No products found</p>
                        <Link
                            href="/admin/products/new"
                            className="mt-3 text-sm text-[#00A59B] hover:underline font-medium"
                        >
                            Create your first product →
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((product) => (
                                <tr
                                    key={product.id}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-3">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <Package size={16} className="text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-medium text-slate-900 hover:text-[#00A59B] transition-colors">
                                                    {product.name}
                                                </span>
                                                <p className="text-xs text-slate-400 mt-0.5">/{product.slug}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{product.category}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900">{formatPrice(product.price)}</span>
                                        {parseFloat(product.mrp) > parseFloat(product.price) && (
                                            <span className="ml-2 text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={product.stock_quantity <= 5 ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                            {product.stock_quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${product.status === 'PUBLISHED'
                                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                                                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/10'
                                                }`}
                                        >
                                            {product.status === 'PUBLISHED' ? '● Published' : '● Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{formatDate(product.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
