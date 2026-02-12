'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Shield, Check, Truck, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function OrderSuccessPage() {
    const params = useParams();
    const orderId = params.id as string;

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="max-w-[1280px] mx-auto px-4 py-20">
                <div className="max-w-2xl mx-auto text-center">
                    {/* Success Icon */}
                    <div className="relative inline-block mb-10">
                        <div className="w-24 h-24 bg-[#eefaf9] rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <Check size={48} className="text-[#00A59B]" strokeWidth={3} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#ffc600] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                            <Shield size={16} className="text-black" />
                        </div>
                    </div>

                    <h1 className="text-[48px] font-black text-[#0a0a0a] mb-6 leading-none" style={{ fontFamily: 'Raleway' }}>
                        Yay! Order Placed.
                    </h1>
                    <p className="text-[#717182] mb-12 text-[18px] font-medium max-w-lg mx-auto">
                        Your health supplements are on their way. We've sent a confirmation and invoice to your dashboard.
                    </p>

                    <div className="bg-[#fcfdfd] border border-gray-100 p-8 rounded-[32px] shadow-sm mb-12 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Package size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[12px] uppercase font-black tracking-widest text-[#00a59b] mb-2">Order ID</p>
                            <p className="text-[24px] font-black text-[#0a0a0a] mb-6 font-mono tracking-tight select-all">{orderId}</p>

                            <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-6">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2">Est. Delivery</p>
                                    <div className="flex items-center gap-2 text-[#0a0a0a] font-bold">
                                        <Truck size={16} className="text-[#00a59b]" />
                                        <span>48 - 72 Hours</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2">Benefit Applied</p>
                                    <div className="flex items-center gap-2 text-[#0a0a0a] font-bold">
                                        <Shield size={16} className="text-[#ffc600]" />
                                        <span>Wallet + Points</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/" className="w-full sm:w-auto">
                            <Button className="w-full h-[64px] px-10 bg-[#00a59b] hover:bg-[#008c84] text-white text-[16px] font-bold rounded-[16px] flex items-center justify-center gap-3 shadow-lg shadow-[#00a59b]/20">
                                <ShoppingBag size={20} />
                                Continue Shopping
                            </Button>
                        </Link>
                        <Link href="/orders" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full h-[64px] px-10 border-gray-200 text-[#0a0a0a] text-[16px] font-bold rounded-[16px] flex items-center justify-center gap-3 hover:bg-gray-50">
                                <Home size={20} />
                                View My Orders
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <footer className="fixed bottom-0 left-0 w-full p-8 text-center bg-white/80 backdrop-blur-sm border-t border-gray-100">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">&copy; 2026 Healthi Marketplace &bull; Secure Health Transaction &bull; Tier 1 Verified</p>
            </footer>
        </div>
    );
}
