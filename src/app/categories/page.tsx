'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StorefrontCard } from '@/components/products/StorefrontCard';
import { Loader2 } from 'lucide-react';
import type { APIProductCard } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function CategoriesIndexPage() {
  const [products, setProducts] = useState<APIProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="site-container py-8">
        <div className="mb-6 text-[13px] text-[var(--text-subtle)]">
          <Link href="/" className="hover:text-[var(--primary)]">Home</Link>
          <span className="mx-2">/</span>
          <span>All collections</span>
        </div>
        <h1 className="mb-6 text-[34px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
          All Collections
        </h1>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 size={34} className="animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <StorefrontCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
