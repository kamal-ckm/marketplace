'use client';

import { Search, ShoppingCart, Menu, X, Loader2, Shield, ChevronDown, ChevronRight, Phone, MessageSquare, User, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import Link from 'next/link';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useCustomerAuth } from '@/lib/auth-customer';
import { useCart } from '@/lib/cart-context';
import { getEntryMode, useHealthiSession } from '@/lib/healthi-session';
import { usePathname, useRouter } from 'next/navigation';

const categories = [
  {
    name: 'Fitness & Physical Health',
    slug: 'fitness-physical-health',
    sub: ['Vitamins', 'Protein', 'Ayurvedic', 'Minerals'],
  },
  {
    name: 'Nutrition & Supplements',
    slug: 'nutrition-supplements',
    sub: ['Protein', 'Fiber', 'Hydration', 'Immunity'],
  },
  {
    name: 'Mental & Lifestyle Wellness',
    slug: 'mental-lifestyle-wellness',
    sub: ['Sleep', 'Calm', 'Focus', 'Stress'],
  },
  {
    name: 'Medical & Condition Care',
    slug: 'medical-condition-care',
    sub: ['Sugar', 'BP', 'Cardiac', 'Orthopedic'],
  },
  {
    name: 'Testing & Diagnostics',
    slug: 'testing-diagnostics',
    sub: ['Home Kits', 'Lab Tests', 'DNA', 'Full Body'],
  },
];

export function Header() {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useCustomerAuth();
  const { summary, loading: cartLoading, setIsCartOpen } = useCart();
  const { session: healthiSession, clearSession } = useHealthiSession();
  const pathname = usePathname();
  const router = useRouter();

  const entryMode = getEntryMode();
  const isHealthiEntry = entryMode === 'healthi';
  const hasHealthiSession = Boolean(healthiSession?.token);

  const cartItemCount = summary?.totalItems || 0;
  const walletBalance = user?.wallet_balance || 0;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);

  function handleCartClick() {
    const isCartFlowPage = pathname.startsWith('/cart') || pathname.startsWith('/checkout');
    if (isCartFlowPage) {
      setIsCartOpen(false);
      if (!pathname.startsWith('/cart')) {
        router.push('/cart');
      }
      return;
    }
    setIsCartOpen(true);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="bg-[var(--text-strong)] text-white">
        <div className="site-container flex min-h-10 items-center justify-between gap-4 text-[12px]">
          <span className="hidden sm:inline-flex items-center gap-2 text-white/90">
            <Phone size={13} />
            Support: 1800-HEALTHI
          </span>
          <span className="mx-auto inline-flex items-center gap-2 font-semibold text-[var(--accent-gold)]">
            <Shield size={13} />
            Wallet approved products and verified sellers only
          </span>
          <span className="hidden sm:inline-flex items-center gap-2 text-white/90">
            <MessageSquare size={13} />
            Track Order
          </span>
        </div>
      </div>

      <div className="bg-white">
        <div className="site-container flex items-center justify-between gap-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-lg font-bold text-white">
              H
            </div>
            <div className="hidden sm:block">
              <p className="text-[22px] font-bold leading-none text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
                Healthi
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-subtle)]">Marketplace</p>
            </div>
          </Link>

          <div className="relative hidden max-w-[520px] flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, categories, and brands"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] pl-11 pr-4 text-[14px] text-[var(--text-strong)] placeholder:text-[var(--text-subtle)] focus:border-[var(--primary)] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-2 lg:flex">
                <Shield size={15} className="text-[var(--primary)]" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-subtle)]">Wallet</p>
                  <p className="text-[13px] font-semibold text-[var(--text-strong)]">{formatCurrency(walletBalance)}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleCartClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-strong)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              aria-label="Open cart"
            >
              {cartLoading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            {isHealthiEntry ? (
              hasHealthiSession ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-sm font-bold uppercase text-[var(--text-strong)]">
                    {(healthiSession?.employee?.name || 'H').charAt(0)}
                  </div>
                  <div className="hidden leading-tight md:block">
                    <p className="text-[13px] font-semibold text-[var(--text-strong)]">{healthiSession?.employee?.name || 'Employee'}</p>
                    <button
                      onClick={clearSession}
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--text-subtle)] hover:text-red-600"
                    >
                      <LogOut size={12} />
                      Clear Session
                    </button>
                  </div>
                </div>
              ) : (
                <span className="hidden text-[12px] font-semibold text-[var(--text-subtle)] sm:block">Open from Healthi</span>
              )
            ) : authLoading ? (
              <Loader2 className="animate-spin text-[var(--text-subtle)]" size={18} />
            ) : isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-sm font-bold uppercase text-[var(--text-strong)]">
                  {user?.name?.charAt(0)}
                </div>
                <div className="hidden leading-tight md:block">
                  <p className="text-[13px] font-semibold text-[var(--text-strong)]">{user?.name}</p>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--text-subtle)] hover:text-red-600"
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button size="sm">Sign In</Button>
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-strong)] md:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-t border-[var(--border)] bg-white md:block">
        <div className="site-container flex items-center justify-start">
          <nav className="flex items-center">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="relative"
                onMouseEnter={() => setActiveMegaMenu(cat.name)}
                onMouseLeave={() => setActiveMegaMenu(null)}
              >
                <button className="flex h-12 items-center gap-1 px-4 text-[13px] font-semibold text-[var(--text-strong)] transition hover:text-[var(--primary)]">
                  {cat.name}
                  {cat.sub.length > 0 && <ChevronDown size={14} className="opacity-50" />}
                </button>

                {cat.sub.length > 0 && activeMegaMenu === cat.name && (
                  <div className="absolute left-0 top-full z-20 w-56 rounded-xl border border-[var(--border)] bg-white p-2 shadow-xl">
                    {cat.sub.map((sub) => (
                      <Link
                        key={sub}
                        href={`/categories/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-[var(--text-body)] transition hover:bg-[var(--surface-alt)] hover:text-[var(--primary)]"
                      >
                        {sub}
                        <ChevronRight size={14} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-[var(--border)] bg-white p-4 md:hidden">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] pl-10 pr-4 text-[14px] focus:border-[var(--primary)] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/categories/${cat.slug}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[14px] font-semibold text-[var(--text-strong)]"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
                <ChevronRight size={16} className="text-[var(--text-subtle)]" />
              </Link>
            ))}
          </div>

          {!isHealthiEntry && !isAuthenticated && (
            <Link href="/login" className="mt-4 block" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full" size="sm">
                <User size={16} className="mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
