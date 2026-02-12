'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StorefrontCard } from '@/components/products/StorefrontCard';
import { Loader2, SlidersHorizontal, ChevronRight } from 'lucide-react';
import type { APIProductCard } from '@/types/api';
import { fetchCategoryTree, fetchVendors, TaxonomyParent, VendorOption } from '@/lib/taxonomy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<APIProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [tree, setTree] = useState<TaxonomyParent[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('categorySlug', slug);
        if (vendorFilter !== 'all') params.set('vendorSlug', vendorFilter);
        if (sortBy !== 'featured') params.set('sort', sortBy);
        if (onlyInStock) params.set('inStock', 'true');
        const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchProducts();
  }, [slug, vendorFilter, sortBy, onlyInStock]);

  useEffect(() => {
    async function loadTaxonomy() {
      const [categoryTree, vendorList] = await Promise.all([fetchCategoryTree(), fetchVendors()]);
      setTree(categoryTree);
      setVendors(vendorList);
    }
    loadTaxonomy();
  }, []);

  const filteredProducts = useMemo(() => {
    const next = [...products];

    const stocked = onlyInStock ? next.filter((item) => item.stock_quantity > 0) : next;

    return stocked;
  }, [products, onlyInStock]);

  const matchedParent = tree.find((parent) => parent.slug === slug);
  const matchedChild = tree.flatMap((parent) => parent.children).find((child) => child.slug === slug);
  const title = matchedChild?.name || matchedParent?.name || slug.replace(/-/g, ' ');

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="site-container py-8">
        <div className="mb-6 flex items-center gap-2 text-[13px] text-[var(--text-subtle)]">
          <Link href="/" className="hover:text-[var(--primary)]">Home</Link>
          <ChevronRight size={13} />
          <span className="capitalize text-[var(--text-body)]">{title}</span>
        </div>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-subtle)]">Collection</p>
              <h1 className="mt-1 text-[34px] font-bold capitalize text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
                {title}
              </h1>
              <p className="text-[14px] text-[var(--text-subtle)]">{filteredProducts.length} products</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text-body)]">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
                In stock only
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text-body)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
              </select>

              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text-body)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="all">All vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.slug}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 size={34} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] text-center">
              <SlidersHorizontal size={28} className="text-slate-400" />
              <p className="text-[15px] font-semibold text-[var(--text-strong)]">No products match your filters</p>
              <p className="text-[13px] text-[var(--text-subtle)]">Try a different sorting option or remove filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <StorefrontCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
