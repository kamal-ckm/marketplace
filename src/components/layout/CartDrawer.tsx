'use client';

import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { Button } from '../ui/Button';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { WalletEligibleBadge } from '@/components/ui/WalletEligibleBadge';

export function CartDrawer() {
    const { isCartOpen, setIsCartOpen, items, summary, removeFromCart, updateQuantity } = useCart();
    const drawerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsCartOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setIsCartOpen]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen]);

    // Never keep drawer open on full cart/checkout pages.
    useEffect(() => {
        if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) {
            setIsCartOpen(false);
        }
    }, [pathname, setIsCartOpen]);

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer Content */}
            <div
                ref={drawerRef}
                className="relative w-full max-w-[450px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={24} className="text-[#00a59b]" strokeWidth={2.5} />
                        <h2 className="text-[20px] font-black text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                            Your Cart
                            <span className="ml-2 text-[14px] text-[#717182] font-bold">({summary.totalItems})</span>
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors text-slate-400 hover:text-black"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <ShoppingBag size={32} className="text-slate-300" strokeWidth={1} />
                            </div>
                            <h3 className="text-[18px] font-bold text-[#0a0a0a] mb-2">Your cart is empty</h3>
                            <p className="text-[#717182] mb-8 text-[14px]">Looks like you have not added any health essentials yet.</p>
                            <Button
                                onClick={() => setIsCartOpen(false)}
                                className="bg-[#00a59b] hover:bg-[#008c84] text-white px-8 py-3 rounded-[12px] font-bold"
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4 group">
                                <div className="w-[100px] h-[100px] bg-[#f8f9fa] rounded-[16px] overflow-hidden flex-shrink-0 border border-gray-50 p-2">
                                    <img
                                        src={item.images?.[0] || '/placeholder-product.jpg'}
                                        alt={item.name}
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between gap-2 mb-1">
                                            <h4 className="text-[15px] font-bold text-[#0a0a0a] leading-tight line-clamp-2">{item.name}</h4>
                                            <span className="text-[15px] font-black text-[#0a0a0a] whitespace-nowrap">
                                                {formatCurrency(parseFloat(item.price))}
                                            </span>
                                        </div>
                                        {item.wallet_eligible && <WalletEligibleBadge className="text-[10px] px-2 py-0.5" />}
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center bg-[#f8f9fa] rounded-[10px] border border-gray-100 p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-[6px] transition-colors text-slate-500"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-[13px] font-bold text-[#0a0a0a]">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-[6px] transition-colors text-slate-500"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-[#717182] hover:text-[#fc3535] transition-colors p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-8 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] bg-white">
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center text-[14px] font-medium text-[#717182]">
                                <span>Subtotal</span>
                                <span>{formatCurrency(summary.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[14px] font-medium text-[#717182]">
                                <span>Estimated Shipping</span>
                                <span className="text-[#00a59b]">FREE</span>
                            </div>
                            <div className="h-px bg-gray-50 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-[18px] font-black text-[#0a0a0a]">Total</span>
                                <span className="text-[24px] font-black text-[#0a0a0a]">{formatCurrency(summary.totalAmount)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link href="/cart">
                                <Button
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full h-[64px] bg-[#00a59b] hover:bg-[#008c84] text-white text-[18px] font-black rounded-[16px] shadow-xl shadow-[#00a59b]/20 flex items-center justify-between px-8"
                                >
                                    View Cart
                                    <ArrowRight size={20} />
                                </Button>
                            </Link>
                            <p className="text-center text-[11px] text-[#717182] font-medium px-4">
                                Taxes calculated at checkout. By continuing, you agree to our terms.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
