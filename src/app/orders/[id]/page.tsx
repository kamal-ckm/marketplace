'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccessPage() {
    const params = useParams();
    const orderId = params.id as string;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-24">
                <div className="max-w-md mx-auto text-center bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" strokeWidth={2} />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Raleway' }}>
                        Order Placed Successfully!
                    </h1>
                    <p className="text-slate-500 mb-8">
                        Thank you for your purchase. Your order has been received and is being processed.
                    </p>

                    <div className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                            Order ID
                        </p>
                        <p className="text-slate-900 font-mono font-medium select-all">
                            {orderId}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Link href="/">
                            <button className="w-full flex items-center justify-center gap-2 bg-[#00A59B] hover:bg-[#008C84] text-white py-3 rounded-xl font-medium transition-colors">
                                <Home size={18} />
                                Return to Home
                            </button>
                        </Link>
                        {/* 
                        <Link href="/account/orders">
                             <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium transition-colors">
                                <ShoppingBag size={18} />
                                View My Orders
                            </button>
                        </Link>
                        */}
                    </div>
                </div>
            </div>
        </div>
    );
}
