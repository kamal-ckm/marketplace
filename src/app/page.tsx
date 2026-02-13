'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { HeroSlideshow } from '@/components/layout/HeroSlideshow';
import { StorefrontCard } from '@/components/products/StorefrontCard';
import { CouponCard } from '@/components/products/CouponCard';
import { Button } from '@/components/ui/Button';
import { Loader2, Package, ShieldCheck, Truck, BadgeCheck, ChevronRight } from 'lucide-react';
import type { APIProductCard } from '@/types/api';
import {
  DEFAULT_HOME_CUSTOMIZATION,
  HOME_CUSTOMIZATION_STORAGE_KEY,
  HomeCustomization,
  parseHomeCustomization,
} from '@/lib/home-customization';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const categories = [
  { name: 'Gym & Fitness', icon: '🏋️' },
  { name: 'Sports', icon: '🎾' },
  { name: 'Diet & Nutrition', icon: '🥗' },
  { name: 'Supplements', icon: '💊' },
  { name: 'Condition Care', icon: '🩺' },
  { name: 'Home Test Kits', icon: '🧪' },
  { name: 'Medical Devices', icon: '🩻' },
  { name: 'Petcare', icon: '🐶' },
];

const deals = [
  {
    id: '1',
    title: 'Get 20% OFF on Gladful products',
    price: 0,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070',
    brand: 'Gladful',
    isFree: true,
  },
  {
    id: '2',
    title: 'Unlock 15% Savings on iPlanet',
    price: 20,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080',
    brand: 'iPlanet',
    isFree: false,
  },
  {
    id: '3',
    title: 'Flat 10% Extra on Whole Foods',
    price: 0,
    image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=2032',
    brand: 'Whole Foods',
    isFree: true,
  },
  {
    id: '4',
    title: 'Exclusive 25% OFF on Fitness Gear',
    price: 50,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070',
    brand: 'FitnessPro',
    isFree: false,
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<APIProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeCustomization>(DEFAULT_HOME_CUSTOMIZATION);

  useEffect(() => {
    // Load local fallback immediately to avoid a blank hero.
    if (typeof window !== 'undefined') {
      setHomeConfig(parseHomeCustomization(localStorage.getItem(HOME_CUSTOMIZATION_STORAGE_KEY)));
    }

    async function fetchHomeCustomization() {
      try {
        const res = await fetch(`${API_BASE}/api/home-customization`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const parsed = parseHomeCustomization(JSON.stringify(data));
        setHomeConfig(parsed);
        if (typeof window !== 'undefined') {
          localStorage.setItem(HOME_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (err) {
        console.error('Failed to fetch home customization:', err);
      }
    }

    fetchHomeCustomization();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let url = `${API_BASE}/api/products`;
        if (selectedCategory) {
          url += `?category=${encodeURIComponent(selectedCategory)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="site-container py-8 md:py-10">
        <HeroSlideshow config={homeConfig} />

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[24px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
              Shop by category
            </h2>
            <Link href="/categories/all" className="text-[14px] font-semibold text-[var(--primary)]">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                  className={`rounded-xl border px-3 py-4 text-center transition ${isActive
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-strong)] hover:border-[var(--primary)]'
                    }`}
                >
                  <div className="text-2xl">{cat.icon}</div>
                  <p className="mt-2 text-[13px] font-semibold leading-4">{cat.name}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section id="products" className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[28px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
              Featured products
            </h2>
            <Link href="/categories/all" className="text-[14px] font-semibold text-[var(--primary)]">
              Browse catalog
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white py-16">
              <Loader2 size={34} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white py-16 text-center">
              <Package size={46} className="mx-auto text-slate-300" strokeWidth={1.2} />
              <p className="mt-4 text-[15px] font-semibold text-[var(--text-strong)]">No products found</p>
              <p className="text-[13px] text-[var(--text-subtle)]">Try another category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <StorefrontCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-white p-6 md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[24px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
              Exclusive partner coupons
            </h2>
            <Link href="/categories/offers" className="text-[14px] font-semibold text-[var(--primary)]">
              See all offers
            </Link>
          </div>

          <div className="mb-6 rounded-lg bg-[#f3f8fa] px-4 py-4 md:px-8 md:py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
              <p className="shrink-0 text-[18px] font-bold leading-8 text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                How it works
              </p>

              <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-[16.8px] font-semibold text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                    1
                  </div>
                  <p className="text-[14px] font-semibold leading-6 text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                    Buy coupon on Healthi
                  </p>
                </div>

                <ChevronRight className="hidden h-[14px] w-[14px] shrink-0 text-[#0a0a0a] md:block" />

                <div className="flex items-center gap-2">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-[16.8px] font-semibold text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                    2
                  </div>
                  <p className="text-[14px] font-semibold leading-6 text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                    Get coupon code instantly via email
                  </p>
                </div>

                <ChevronRight className="hidden h-[14px] w-[14px] shrink-0 text-[#0a0a0a] md:block" />

                <div className="flex items-center gap-2">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-[16.8px] font-semibold text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                    3
                  </div>
                  <p className="text-[14px] font-semibold leading-6 text-[#0a0a0a]" style={{ fontFamily: 'Raleway' }}>
                    Use code on vendor site to unlock deals
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((deal) => (
              <CouponCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <BadgeCheck size={16} />
            </div>
            <p className="text-[15px] font-semibold text-[var(--text-strong)]">Verified quality products</p>
            <p className="mt-1 text-[13px] text-[var(--text-subtle)]">Trusted sellers and reviewed inventory.</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <ShieldCheck size={16} />
            </div>
            <p className="text-[15px] font-semibold text-[var(--text-strong)]">Wallet-ready checkout</p>
            <p className="mt-1 text-[13px] text-[var(--text-subtle)]">Use eligible balance directly in cart.</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <Truck size={16} />
            </div>
            <p className="text-[15px] font-semibold text-[var(--text-strong)]">Fast shipping nationwide</p>
            <p className="mt-1 text-[13px] text-[var(--text-subtle)]">Quick delivery and easy returns support.</p>
          </div>
        </section>
      </main>

      <footer className="mt-10 border-t border-[var(--border)] bg-white">
        <div className="site-container grid gap-8 py-10 md:grid-cols-4">
          <div>
            <p className="text-[20px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
              Healthi Marketplace
            </p>
            <p className="mt-2 text-[14px] text-[var(--text-body)]">
              Member-first wellness shopping with transparent pricing and wallet integration.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-subtle)]">Shop</p>
            <ul className="mt-3 space-y-2 text-[14px] text-[var(--text-body)]">
              <li><Link href="/categories/fitness-physical-health">Fitness</Link></li>
              <li><Link href="/categories/nutrition-supplements">Nutrition</Link></li>
              <li><Link href="/categories/testing-diagnostics">Diagnostics</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-subtle)]">Support</p>
            <ul className="mt-3 space-y-2 text-[14px] text-[var(--text-body)]">
              <li><Link href="/cart">Cart</Link></li>
              <li><Link href="/checkout">Checkout</Link></li>
              <li><Link href="/login">Account</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-subtle)]">Contact</p>
            <p className="mt-3 text-[14px] text-[var(--text-body)]">support@healthi.market</p>
            <p className="text-[14px] text-[var(--text-body)]">1800-HEALTHI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
