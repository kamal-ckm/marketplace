'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Loader2, Wallet, Shield, Star, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useCustomerAuth } from '@/lib/auth-customer';
import { Button } from '@/components/ui/Button';
import { WalletEligibleBadge } from '@/components/ui/WalletEligibleBadge';

export const dynamic = 'force-dynamic';

export default function CartPage() {
    const { items, summary, loading, updateQuantity, removeFromCart } = useCart();
    const { user, isAuthenticated } = useCustomerAuth();
    const [updating, setUpdating] = useState<string | null>(null);

    // Benefit States
    const [useWalletSelected, setUseWalletSelected] = useState(true);
    const [useRewardsSelected, setUseRewardsSelected] = useState(true);
    const [walletAmount, setWalletAmount] = useState(0);
    const [rewardsAmount, setRewardsAmount] = useState(0);
    const hasInitializedBenefits = useRef(false);

    const totalAmount = summary.totalAmount;

    // Calculate eligibility based on items in cart
    const walletEligibleTotal = items.reduce((acc, item) => {
        return acc + (item.wallet_eligible ? parseFloat(item.price) * item.quantity : 0);
    }, 0);

    const rewardsEligibleTotal = items.reduce((acc, item) => {
        return acc + (item.rewards_eligible ? parseFloat(item.price) * item.quantity : 0);
    }, 0);

    const userWalletBalance = user?.wallet_balance || 0;
    const userRewardsBalance = user?.rewards_balance || 0;

    const maxWalletAllowedByEligibility = Math.min(walletEligibleTotal, userWalletBalance);
    const maxRewardsAllowedByEligibility = Math.min(rewardsEligibleTotal, userRewardsBalance);
    const nonWalletEligibleTotal = Math.max(0, totalAmount - walletEligibleTotal);
    const nonRewardsEligibleTotal = Math.max(0, totalAmount - rewardsEligibleTotal);
    const [beneficiaryId, setBeneficiaryId] = useState('self');
    const [beneficiaryName, setBeneficiaryName] = useState('Self');
    const [beneficiaryType, setBeneficiaryType] = useState('Employee');
    const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('self');
    const beneficiaryOptions = [
        { id: 'self', name: 'Self', type: 'Employee' },
        { id: 'spouse', name: 'Spouse', type: 'Family' },
        { id: 'child', name: 'Child', type: 'Family' },
        { id: 'parent', name: 'Parent', type: 'Family' },
    ];
    const selectedBeneficiary =
        beneficiaryOptions.find((option) => option.id === selectedBeneficiaryId) ||
        { id: beneficiaryId, name: beneficiaryName, type: beneficiaryType };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setBeneficiaryId(params.get('beneficiaryId') || 'self');
        setBeneficiaryName(params.get('beneficiaryName') || user?.name || 'Self');
        setBeneficiaryType(params.get('beneficiaryType') || 'Employee');
    }, [user?.name]);
    const appliedWalletAmount = useWalletSelected ? Math.min(walletAmount, maxWalletAllowedByEligibility, totalAmount) : 0;
    const appliedRewardsAmount = useRewardsSelected
        ? Math.min(rewardsAmount, maxRewardsAllowedByEligibility, Math.max(0, totalAmount - appliedWalletAmount))
        : 0;

    const handleWalletChange = (val: number) => {
        const next = Math.min(val, maxWalletAllowedByEligibility, totalAmount);
        setWalletAmount(next);
        if (useRewardsSelected && next + rewardsAmount > totalAmount) {
            setRewardsAmount(Math.max(0, totalAmount - next));
        }
    };

    const handleRewardsChange = (val: number) => {
        const next = Math.min(val, maxRewardsAllowedByEligibility, totalAmount);
        setRewardsAmount(next);
        if (useWalletSelected && walletAmount + next > totalAmount) {
            setWalletAmount(Math.max(0, totalAmount - next));
        }
    };

    useEffect(() => {
        if (items.length === 0) {
            hasInitializedBenefits.current = false;
            setWalletAmount(0);
            setRewardsAmount(0);
            setUseWalletSelected(true);
            setUseRewardsSelected(true);
            return;
        }

        if (!hasInitializedBenefits.current) {
            const initialWallet = Math.min(maxWalletAllowedByEligibility, totalAmount);
            const initialRewards = Math.min(maxRewardsAllowedByEligibility, Math.max(0, totalAmount - initialWallet));
            setUseWalletSelected(true);
            setUseRewardsSelected(true);
            setWalletAmount(initialWallet);
            setRewardsAmount(initialRewards);
            hasInitializedBenefits.current = true;
            return;
        }

        if (walletAmount > maxWalletAllowedByEligibility) {
            setWalletAmount(maxWalletAllowedByEligibility);
        }
        const maxRewardsAllowedNow = Math.min(
            maxRewardsAllowedByEligibility,
            Math.max(0, totalAmount - (useWalletSelected ? walletAmount : 0))
        );
        if (rewardsAmount > maxRewardsAllowedNow) {
            setRewardsAmount(maxRewardsAllowedNow);
        }
    }, [
        items.length,
        maxWalletAllowedByEligibility,
        maxRewardsAllowedByEligibility,
        totalAmount,
        walletAmount,
        rewardsAmount,
        useWalletSelected,
    ]);

    const handleWalletToggle = (checked: boolean) => {
        setUseWalletSelected(checked);
        if (!checked) {
            setWalletAmount(0);
            return;
        }
        const nextWallet = Math.min(maxWalletAllowedByEligibility, Math.max(0, totalAmount - (useRewardsSelected ? rewardsAmount : 0)));
        setWalletAmount(nextWallet);
    };

    const handleRewardsToggle = (checked: boolean) => {
        setUseRewardsSelected(checked);
        if (!checked) {
            setRewardsAmount(0);
            return;
        }
        const nextRewards = Math.min(maxRewardsAllowedByEligibility, Math.max(0, totalAmount - (useWalletSelected ? walletAmount : 0)));
        setRewardsAmount(nextRewards);
    };

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
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <div className="max-w-[1280px] mx-auto px-4 py-12">
                <div className="flex items-center gap-2 text-[14px] text-[#717182] mb-8">
                    <Link href="/" className="hover:text-[#00A59B]">Home</Link>
                    <ChevronRight size={14} className="text-slate-300" />
                    <span className="text-[#0a0a0a] font-medium">Shopping Cart</span>
                </div>

                <h1 className="text-[36px] font-bold text-[#0a0a0a] mb-10" style={{ fontFamily: 'Raleway' }}>
                    Your Cart <span className="text-[#717182] font-medium">({items.length} items)</span>
                </h1>

                {loading && items.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-[#00A59B]" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="max-w-2xl mx-auto py-20 text-center">
                        <div className="w-24 h-24 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-8">
                            <ShoppingCart size={40} className="text-slate-300" />
                        </div>
                        <h2 className="text-[24px] font-bold text-[#0a0a0a] mb-4" style={{ fontFamily: 'Raleway' }}>Empty Cart</h2>
                        <p className="text-[#717182] mb-10 text-[16px]">Your shopping cart is waiting for you to fill it with health and wellness.</p>
                        <Link href="/">
                            <Button className="bg-[#00a59b] hover:bg-[#008c84] px-10 h-[56px] text-[16px] font-bold rounded-[12px]">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-8 space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-6 p-6 bg-[#fcfdfd] border border-gray-100 rounded-[20px] group transition-all hover:shadow-md hover:shadow-gray-100/50">
                                    {/* Image */}
                                    <div className="w-[120px] h-[120px] bg-white rounded-[16px] border border-gray-50 flex-shrink-0 flex items-center justify-center p-4">
                                        {item.images && item.images[0] ? (
                                            <img src={item.images[0]} alt={item.name} className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <ShoppingCart size={32} className="text-slate-100" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div className="flex justify-between gap-4">
                                            <div>
                                                <h3 className="text-[18px] font-bold text-[#0a0a0a] leading-tight mb-1 group-hover:text-[#00a59b] transition-colors">{item.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[#0a0a0a] font-bold text-[18px]">{formatCurrency(parseFloat(item.price))}</p>
                                                    {item.wallet_eligible && <WalletEligibleBadge className="text-[10px] px-2 py-0.5" />}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-[#fc3535] hover:bg-[#fc3535]/5 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-white border border-gray-100 rounded-[10px] p-1 shadow-sm">
                                                <button
                                                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                                    disabled={updating === item.id || item.quantity <= 1}
                                                    className="w-8 h-8 flex items-center justify-center text-[#717182] hover:bg-[#f3f4f6] rounded-[6px] disabled:opacity-30"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-10 text-center font-bold text-[#0a0a0a]">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                                    disabled={updating === item.id}
                                                    className="w-8 h-8 flex items-center justify-center text-[#717182] hover:bg-[#f3f4f6] rounded-[6px] disabled:opacity-30"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            {updating === item.id && <Loader2 size={16} className="animate-spin text-[#00A59B]" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Benefit Selectors */}
                            {isAuthenticated && (
                                <div className="bg-[#fcfdfd] border border-gray-100 rounded-[24px] p-8 shadow-sm">
                                    <h3 className="text-[16px] font-bold text-[#0a0a0a] uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
                                        <Shield size={20} className="text-[#00A59B]" />
                                        Benefit Coverage
                                    </h3>
                                    <div className="mb-5 rounded-[12px] border border-gray-100 bg-white p-4">
                                        <label className="block text-[13px] font-bold text-[#0a0a0a] mb-2">Choose dependent</label>
                                        <select
                                            value={selectedBeneficiaryId}
                                            onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                                            className="w-full h-[44px] rounded-[10px] border border-gray-200 bg-white px-3 text-[14px] font-semibold text-[#0a0a0a] outline-none focus:border-[#00A59B]"
                                        >
                                            {beneficiaryOptions.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-2 text-[12px] text-[#717182]">
                                            Selected: {selectedBeneficiary.name} ({selectedBeneficiary.type})
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-[16px] border border-[#d9efec] bg-white">
                                            <div className="flex items-start justify-between gap-3">
                                                <label className="inline-flex items-center gap-2.5 text-[12px] font-bold text-[#0a0a0a] cursor-pointer rounded-full border border-[#d9efec] bg-[#f8fcfb] px-3 py-1.5 transition-all hover:border-[#00a59b]/40">
                                                    <input
                                                        type="checkbox"
                                                        checked={useWalletSelected}
                                                        onChange={(e) => handleWalletToggle(e.target.checked)}
                                                        className="peer sr-only"
                                                    />
                                                    <span className="h-5 w-5 rounded-[6px] border border-[#b8d7d2] bg-white flex items-center justify-center transition-all peer-checked:bg-[#00A59B] peer-checked:border-[#00A59B]">
                                                        {useWalletSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </span>
                                                    Use Healthi Wallet
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eefaf9] text-[#00a59b]">
                                                    <Wallet size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0a0a0a] text-[14px]">Healthi Wallet</p>
                                                    <p className="text-[12px] text-[#717182]">{formatCurrency(userWalletBalance)} available</p>
                                                </div>
                                            </div>
                                            {useWalletSelected && (
                                                <div className="mt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[11px] font-bold text-[#00a59b] uppercase tracking-wider">Apply wallet</span>
                                                    <span className="text-[15px] font-bold text-[#0a0a0a]">{formatCurrency(walletAmount)}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxWalletAllowedByEligibility}
                                                    step="1"
                                                    value={walletAmount}
                                                    onChange={(e) => handleWalletChange(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-[#d0eee8] rounded-lg appearance-none cursor-pointer accent-[#00A59B]"
                                                />
                                                <div className="mt-2 flex justify-between text-[11px] text-[#717182]">
                                                    <span>₹0</span>
                                                    <span>Max {formatCurrency(maxWalletAllowedByEligibility)}</span>
                                                </div>
                                                {nonWalletEligibleTotal > 0 && (
                                                    <p className="mt-2 text-[11px] text-[#717182]">
                                                        {formatCurrency(nonWalletEligibleTotal)} not wallet-eligible.
                                                    </p>
                                                )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 rounded-[16px] border border-amber-200 bg-white">
                                            <div className="flex items-start justify-between gap-3">
                                                <label className="inline-flex items-center gap-2.5 text-[12px] font-bold text-[#0a0a0a] cursor-pointer rounded-full border border-amber-200 bg-amber-50/50 px-3 py-1.5 transition-all hover:border-amber-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={useRewardsSelected}
                                                        onChange={(e) => handleRewardsToggle(e.target.checked)}
                                                        className="peer sr-only"
                                                    />
                                                    <span className="h-5 w-5 rounded-[6px] border border-amber-300 bg-white flex items-center justify-center transition-all peer-checked:bg-amber-500 peer-checked:border-amber-500">
                                                        {useRewardsSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </span>
                                                    Use Rewards
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-500">
                                                    <Star size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0a0a0a] text-[14px]">Rewards</p>
                                                    <p className="text-[12px] text-[#717182]">₹{userRewardsBalance} available</p>
                                                </div>
                                            </div>
                                            {useRewardsSelected && (
                                                <div className="mt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Use rewards</span>
                                                    <span className="text-[15px] font-bold text-[#0a0a0a]">₹{rewardsAmount}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={maxRewardsAllowedByEligibility}
                                                    step="1"
                                                    value={rewardsAmount}
                                                    onChange={(e) => handleRewardsChange(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                />
                                                <div className="mt-2 flex justify-between text-[11px] text-[#717182]">
                                                    <span>₹0</span>
                                                    <span>Max ₹{maxRewardsAllowedByEligibility}</span>
                                                </div>
                                                {nonRewardsEligibleTotal > 0 && (
                                                    <p className="mt-2 text-[11px] text-[#717182]">
                                                        {formatCurrency(nonRewardsEligibleTotal)} not rewards-eligible.
                                                    </p>
                                                )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Recap */}
                            <div className="bg-[#fcfdfd] border border-gray-100 rounded-[24px] p-8 shadow-md sticky top-24">
                                <h2 className="text-[20px] font-bold text-[#0a0a0a] mb-8" style={{ fontFamily: 'Raleway' }}>Summary</h2>

                                <div className="space-y-4 mb-8 text-[15px]">
                                    <div className="flex justify-between text-[#717182]">
                                        <span>Total MRP</span>
                                        <span className="font-bold">{formatCurrency(summary.totalAmount)}</span>
                                    </div>
                                    {appliedWalletAmount > 0 && (
                                        <div className="flex justify-between text-[#00a59b] font-bold">
                                            <span>Wallet Applied</span>
                                            <span>-{formatCurrency(appliedWalletAmount)}</span>
                                        </div>
                                    )}
                                    {appliedRewardsAmount > 0 && (
                                        <div className="flex justify-between text-amber-600 font-bold">
                                            <span>Rewards Applied</span>
                                            <span>-{formatCurrency(appliedRewardsAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[#717182]">
                                        <span>Logistics & Handling</span>
                                        <span className="text-[#00a59b] font-bold">FREE</span>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[18px] font-bold text-[#0a0a0a]">Payable</span>
                                        <div className="text-right">
                                            <span className="text-[28px] font-black text-[#00a59b] block leading-none">
                                                {formatCurrency(Math.max(0, summary.totalAmount - appliedWalletAmount - appliedRewardsAmount))}
                                            </span>
                                            <span className="text-[10px] text-[#717182] font-bold uppercase tracking-widest mt-1">Inclusive of GST</span>
                                        </div>
                                    </div>
                                </div>

                                <Link href={`/checkout?wallet=${appliedWalletAmount}&rewards=${appliedRewardsAmount}&beneficiaryId=${encodeURIComponent(selectedBeneficiary.id)}&beneficiaryName=${encodeURIComponent(selectedBeneficiary.name)}&beneficiaryType=${encodeURIComponent(selectedBeneficiary.type)}`} className="block">
                                    <Button className="w-full h-[64px] bg-[#00a59b] hover:bg-[#008c84] text-white text-[18px] font-bold rounded-[16px] shadow-lg shadow-[#00a59b]/20 flex items-center justify-center gap-2">
                                        Confirm Benefits & Continue
                                        <ArrowRight size={20} />
                                    </Button>
                                </Link>

                                <div className="mt-6 p-4 rounded-[12px] bg-[#fdfefd] border border-[#f0f9f8] text-center">
                                    <p className="text-[12px] text-[#717182] font-semibold flex items-center justify-center gap-2">
                                        <Shield size={14} className="text-[#00A59B]" />
                                        100% Secure & Tax-free Transactions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-20 border-t border-[var(--border)] bg-white py-10">
                <div className="max-w-[1280px] mx-auto px-4 text-center">
                    <p className="text-[12px] uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                        &copy; 2026 Healthi Marketplace. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
