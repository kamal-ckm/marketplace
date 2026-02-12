'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useCustomerAuth, getCustomerAuthHeaders } from '@/lib/auth-customer';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Loader2, ArrowRight, User, MapPin, Truck, Shield, ChevronRight, Mail, CreditCard, Search, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, summary, loading: cartLoading, refreshCart } = useCart();
    const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useCustomerAuth();

    const [workEmail, setWorkEmail] = useState('');
    const [country, setCountry] = useState('India');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [stateName, setStateName] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [phone, setPhone] = useState('');
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');
    const [beneficiaryName, setBeneficiaryName] = useState('Self');
    const [beneficiaryType, setBeneficiaryType] = useState('Employee');
    const [requestedWallet, setRequestedWallet] = useState(0);
    const [requestedRewards, setRequestedRewards] = useState(0);

    // Pre-calculate eligibility
    const walletEligibleAmount = items.reduce((sum, item) => item.wallet_eligible ? sum + (parseFloat(item.price) * item.quantity) : sum, 0);
    const rewardsEligibleAmount = items.reduce((sum, item) => item.rewards_eligible ? sum + (parseFloat(item.price) * item.quantity) : sum, 0);

    const maxWalletPossible = Math.min(walletEligibleAmount, user?.wallet_balance || 0);
    const maxRewardsPossible = Math.min(rewardsEligibleAmount, user?.rewards_balance || 0);

    const totalAmount = summary.totalAmount;
    const appliedWalletAmount = Math.min(requestedWallet, maxWalletPossible, totalAmount);
    const appliedRewardsAmount = Math.min(requestedRewards, maxRewardsPossible, totalAmount - appliedWalletAmount);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/checkout');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setBeneficiaryName(params.get('beneficiaryName') || user?.name || 'Self');
        setBeneficiaryType(params.get('beneficiaryType') || 'Employee');
        setRequestedWallet(parseFloat(params.get('wallet') || '0'));
        setRequestedRewards(parseFloat(params.get('rewards') || '0'));
    }, [user?.name]);

    const cashPayable = Math.max(0, summary.totalAmount - appliedWalletAmount - appliedRewardsAmount);

    async function handlePlaceOrder() {
        const finalWorkEmail = workEmail.trim() || user?.email || '';
        if (!finalWorkEmail) {
            setError('Please enter your work email.');
            return;
        }
        if (!addressLine1.trim() || !city.trim() || !stateName.trim() || !pinCode.trim() || !phone.trim()) {
            setError('Please complete all required billing address fields.');
            return;
        }

        const composedAddress = [
            `${firstName} ${lastName}`.trim(),
            addressLine1.trim(),
            addressLine2.trim(),
            `${city.trim()}, ${stateName.trim()} ${pinCode.trim()}`.trim(),
            country.trim(),
            `Phone: ${phone.trim()}`
        ].filter(Boolean).join(', ');

        setPlacing(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE}/api/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCustomerAuthHeaders(),
                },
                body: JSON.stringify({
                    shippingAddress: composedAddress,
                    walletAmount: appliedWalletAmount,
                    rewardsAmount: appliedRewardsAmount,
                    beneficiary: beneficiaryType,
                    workEmail: finalWorkEmail,
                    paymentMethod: 'RAZORPAY'
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to place order.');
                setPlacing(false);
                return;
            }

            // Success! 
            await refreshCart();
            await refreshUser(); // Update wallet balance in header
            router.push(`/orders/${data.orderId}/success`);

        } catch (err) {
            setError('Network error. Please try again.');
            setPlacing(false);
        }
    }

    if (authLoading || cartLoading || !user) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-[#00A59B]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] pb-20">
            <Header />

            <div className="max-w-[1280px] mx-auto px-4 py-12">
                <div className="flex items-center gap-2 text-[14px] text-[#717182] mb-8">
                    <Link href="/cart" className="hover:text-[#00A59B]">Shopping Cart</Link>
                    <ChevronRight size={14} className="text-slate-300" />
                    <span className="text-[#0a0a0a] font-medium">Checkout</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <h1 className="text-[36px] md:text-[48px] font-black text-[#0a0a0a] leading-tight" style={{ fontFamily: 'Raleway' }}>
                        Payment
                    </h1>

                    {/* Checkout Progress Stepper (Mix Theme Style) */}
                    <div className="flex items-center gap-4">
                        {[
                            { step: 1, label: 'Cart', completed: true },
                            { step: 2, label: 'Payment', active: true }
                        ].map((s, i) => (
                            <React.Fragment key={s.label}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black transition-all ${s.active || s.completed ? 'bg-[#00a59b] text-white shadow-lg shadow-[#00a59b]/20' : 'bg-gray-100 text-slate-400'}`}>
                                        {s.step}
                                    </div>
                                    <span className={`text-[12px] font-black uppercase tracking-widest ${s.active || s.completed ? 'text-[#0a0a0a]' : 'text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < 1 && <div className="w-12 h-px bg-gray-200 hidden sm:block" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Left: Form */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* 1. Contact */}
                        <div className="bg-[#fcfdfd] border border-gray-100 p-8 rounded-[32px] shadow-sm">
                            <h2 className="flex items-center gap-3 text-[18px] font-black text-[#0a0a0a] mb-8 uppercase tracking-[0.2em]">
                                <div className="w-8 h-8 rounded-lg bg-[#00a59b] flex items-center justify-center text-white">
                                    <Mail size={16} />
                                </div>
                                1. Contact
                            </h2>
                            <label className="block text-[13px] font-bold text-[#0a0a0a] mb-2">Work Email</label>
                            <input
                                type="email"
                                value={workEmail}
                                onChange={(e) => setWorkEmail(e.target.value)}
                                placeholder={user?.email || 'Enter your work email'}
                                className="w-full bg-white border border-gray-200 rounded-[14px] px-4 py-3 focus:border-[#00a59b] focus:ring-0 outline-none transition-all text-[#0a0a0a] text-[15px]"
                            />
                        </div>

                        {/* 2. Beneficiary */}
                        <div className="bg-[#fcfdfd] border border-gray-100 p-8 rounded-[32px] shadow-sm">
                            <h2 className="flex items-center gap-3 text-[18px] font-black text-[#0a0a0a] mb-8 uppercase tracking-[0.2em]">
                                <div className="w-8 h-8 rounded-lg bg-[#00a59b] flex items-center justify-center text-white">
                                    <User size={16} />
                                </div>
                                2. Beneficiary
                            </h2>
                            <div className="mb-5 rounded-[12px] border border-gray-100 bg-white p-4">
                                <p className="text-[14px] font-bold text-[#0a0a0a]">{beneficiaryName}</p>
                            </div>
                            <Link
                                href="/cart"
                                className="text-[13px] font-bold hover:underline"
                                style={{ color: '#2563eb' }}
                            >
                                Edit in cart
                            </Link>
                        </div>

                        {/* 3. Billing Address */}
                        <div className="bg-[#fcfdfd] border border-gray-100 p-8 rounded-[32px] shadow-sm">
                            <h2 className="flex items-center gap-3 text-[18px] font-black text-[#0a0a0a] mb-8 uppercase tracking-[0.2em] relative">
                                <div className="w-8 h-8 rounded-lg bg-[#00a59b] flex items-center justify-center text-white">
                                    <MapPin size={16} />
                                </div>
                                3. Billing Address
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] text-[#717182] mb-1">Country/Region</label>
                                    <select
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full h-[52px] rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    >
                                        <option>India</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="First name (optional)"
                                        className="h-[52px] rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    />
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Last name"
                                        className="h-[52px] rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        value={addressLine1}
                                        onChange={(e) => setAddressLine1(e.target.value)}
                                        placeholder="Address"
                                        className="h-[52px] w-full rounded-[12px] border border-gray-200 bg-white px-4 pr-10 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    />
                                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717182]" />
                                </div>
                                <input
                                    value={addressLine2}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                    placeholder="Apartment, suite, etc. (optional)"
                                    className="h-[52px] w-full rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <input
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="City"
                                        className="h-[52px] rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    />
                                    <input
                                        value={stateName}
                                        onChange={(e) => setStateName(e.target.value)}
                                        placeholder="State"
                                        className="h-[52px] rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    />
                                    <input
                                        value={pinCode}
                                        onChange={(e) => setPinCode(e.target.value)}
                                        placeholder="PIN code"
                                        className="h-[52px] rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter 10 digit valid mobile number"
                                        className="h-[52px] w-full rounded-[12px] border border-gray-200 bg-white px-4 pr-10 text-[15px] text-[#0a0a0a] outline-none focus:border-[#00a59b]"
                                    />
                                    <HelpCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717182]" />
                                </div>
                            </div>
                        </div>

                        {/* 4. Payment Method */}
                        <div className="bg-[#fcfdfd] border border-gray-100 p-8 rounded-[32px] shadow-sm">
                            <h2 className="flex items-center gap-3 text-[18px] font-black text-[#0a0a0a] mb-6 uppercase tracking-[0.2em]">
                                <div className="w-8 h-8 rounded-lg bg-[#00a59b] flex items-center justify-center text-white">
                                    <CreditCard size={16} />
                                </div>
                                4. Payment Method
                            </h2>
                            <div className="rounded-[14px] border border-[#d9efec] bg-[#f4fbfa] p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[14px] font-bold text-[#0a0a0a]">Razorpay Secure</p>
                                    <p className="text-[12px] text-[#717182]">UPI, Cards, Netbanking, Wallets</p>
                                </div>
                                <span className="text-[12px] font-bold text-[#00a59b]">Default</span>
                            </div>
                            {error && (
                                <div className="mt-4 p-4 bg-[#fc3535]/5 border border-[#fc3535]/10 rounded-[16px] text-[#fc3535] text-[13px] font-bold flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[#fc3535]" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 rounded-[24px] border border-[var(--border)] bg-white p-8 shadow-sm">
                            <h2 className="mb-8 text-[20px] font-black uppercase tracking-[0.1em] text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
                                Review Order
                            </h2>

                            {/* Item List in Summary */}
                            <div className="mb-10 space-y-5 border-b border-[var(--border)] pb-10">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-14 h-14 bg-white rounded-xl p-2 flex-shrink-0 relative">
                                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain" />
                                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#00a59b] text-[10px] font-black text-white">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="line-clamp-2 text-[13px] font-bold text-[var(--text-strong)]">{item.name}</p>
                                            <p className="mt-1 text-[12px] font-bold text-[var(--text-subtle)]">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between font-medium text-[var(--text-subtle)]">
                                    <span>Items Subtotal</span>
                                    <span>{formatCurrency(summary.totalAmount)}</span>
                                </div>
                                {appliedWalletAmount > 0 && (
                                    <div className="flex justify-between text-[#00a59b] font-bold">
                                        <span>Wallet Applied</span>
                                        <span>-{formatCurrency(appliedWalletAmount)}</span>
                                    </div>
                                )}
                                {appliedRewardsAmount > 0 && (
                                    <div className="flex justify-between text-amber-500 font-bold">
                                        <span>Rewards Applied</span>
                                        <span>-{appliedRewardsAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-medium text-[var(--text-subtle)]">
                                    <span>Logistics</span>
                                    <span className="text-[#00a59b]">FREE</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-[var(--border)] pt-8">
                                    <span className="text-[16px] font-bold text-[var(--text-strong)]">Total Payable</span>
                                    <div className="text-right">
                                        <span className="text-[32px] font-black text-[#00A59B] block leading-none">
                                            {formatCurrency(cashPayable)}
                                        </span>
                                        {cashPayable > 0 && (
                                            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-subtle)]">Pay on delivery</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handlePlaceOrder}
                                disabled={placing}
                                className="w-full h-[64px] bg-[#00a59b] hover:bg-[#008c84] text-white rounded-[18px] font-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-[18px] group shadow-xl shadow-[#00a59b]/20"
                            >
                                {placing ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <>
                                        Pay Now
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-4 text-[12px] font-medium text-[var(--text-subtle)]">
                                    <Shield size={16} className="text-[#00a59b]" />
                                    <span>End-to-end encrypted protocol</span>
                                </div>
                                <div className="flex items-center gap-4 text-[12px] font-medium text-[var(--text-subtle)]">
                                    <Truck size={16} className="text-[#00a59b]" />
                                    <span>Express 48-hour delivery</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
