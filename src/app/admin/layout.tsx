'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, LogOut, LayoutDashboard, ShoppingBag, SlidersHorizontal, Tags, Building2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: Tags },
  { label: 'Vendors', href: '/admin/vendors', icon: Building2 },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Home Customization', href: '/admin/home', icon: SlidersHorizontal },
];

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A59B]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="h-screen bg-[#F1F5F9] flex overflow-hidden">
      <aside className="w-64 min-w-[16rem] bg-[#0F172A] text-white flex flex-col h-full z-20">
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00A59B] rounded-lg flex items-center justify-center font-bold text-sm">H</div>
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Healthi Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#00A59B] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ← Back to Storefront
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <span className="text-sm text-slate-500 font-medium">Admin Panel</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00A59B] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-medium text-slate-700">{user?.name || 'Admin'}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </AuthProvider>
  );
}
