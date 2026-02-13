'use client';

import Link from 'next/link';
import { Loader2, Package, Star, ShoppingCart } from 'lucide-react';
import type { APIProductCard } from '@/types/api';
import { Button } from '../ui/Button';
import { useCart } from '@/lib/cart-context';
import { useCustomerAuth } from '@/lib/auth-customer';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WalletEligibleBadge } from '@/components/ui/WalletEligibleBadge';

interface StorefrontCardProps {
  product: APIProductCard;
}

export function StorefrontCard({ product }: StorefrontCardProps) {
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [adding, setAdding] = useState(false);

  const price = parseFloat(product.price);
  const mrp = parseFloat(product.mrp);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const mainImage = product.images?.[0] || null;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setAdding(true);
    const res = await addToCart(product.id, 1);
    setAdding(false);

    if (res.success) {
      setIsCartOpen(true);
    } else if (res.error) {
      alert(res.error);
    }
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative m-3 aspect-square overflow-hidden rounded-xl bg-[var(--surface-alt)]">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={42} className="text-slate-300" strokeWidth={1.3} />
          </div>
        )}

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-[var(--primary)] px-2 py-1 text-[11px] font-bold text-white">
            {discount}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <Link href={`/products/${product.slug}`}>
          <h3
            className="line-clamp-2 min-h-[42px] text-[15px] font-semibold leading-5 text-[var(--text-strong)] transition group-hover:text-[var(--primary)]"
            style={{ fontFamily: 'Raleway' }}
          >
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-[12px]">
          <div className="inline-flex items-center gap-1 text-[var(--text-subtle)]">
            <Star size={13} className="text-[var(--accent-gold)]" fill="var(--accent-gold)" />
            4.8
          </div>
          <div className="flex items-baseline gap-2">
            {mrp > price && <span className="text-[var(--text-subtle)] line-through">₹{mrp.toLocaleString('en-IN')}</span>}
            <span className="text-[18px] font-bold text-[var(--text-strong)]">₹{price.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <Button
          className="mt-auto w-full"
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0 || adding}
        >
          {adding ? (
            <Loader2 size={15} className="mr-2 animate-spin" />
          ) : (
            <ShoppingCart size={15} className="mr-2" />
          )}
          {product.stock_quantity === 0 ? 'Out of stock' : 'Add to cart'}
        </Button>

        {/* Reserved meta row so CTAs align across cards */}
        <div className="mt-2 flex min-h-[28px] items-center justify-between text-[11px]">
          {product.wallet_eligible ? <WalletEligibleBadge /> : <span />}

          {product.stock_quantity > 0 && product.stock_quantity < 10 ? (
            <span className="font-semibold text-[#c2410c]">Only {product.stock_quantity} left</span>
          ) : (
            <span />
          )}
        </div>
      </div>
    </article>
  );
}
