'use client';

import { Product } from '@/types';
import { cn, formatCurrency, calculateDiscount } from '@/lib/utils';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  className?: string;
}

export function ProductCard({ product, onAddToCart, onAddToWishlist, className }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const discountPercentage = calculateDiscount(product.mrp, product.sellingPrice);
  const mainImage = product.images[0]?.url || '/placeholder-product.jpg';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAddingToCart(true);
    await onAddToCart?.(product.id);
    setIsAddingToCart(false);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
    onAddToWishlist?.(product.id);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <article
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white transition hover:-translate-y-0.5 hover:shadow-lg',
          className,
        )}
      >
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.badges?.includes('wallet_eligible') && (
            <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)]">
              Wallet eligible
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-semibold text-white">
              {discountPercentage}% OFF
            </span>
          )}
        </div>

        <button
          onClick={handleToggleWishlist}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[var(--text-subtle)] shadow-sm"
          aria-label="Add to wishlist"
        >
          <Heart className={cn('h-4 w-4 transition-colors', isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
        </button>

        <div className="relative m-3 aspect-square overflow-hidden rounded-xl bg-[var(--surface-alt)]">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.stockQuantity === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[13px] font-semibold text-white">
              Out of stock
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 px-4 pb-4">
          {product.vendor && <p className="text-[12px] text-[var(--text-subtle)]">{product.vendor.name}</p>}

          <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-semibold text-[var(--text-strong)] group-hover:text-[var(--primary)]">
            {product.name}
          </h3>

          {product.rating && (
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-subtle)]">
              <Star className="h-4 w-4 fill-[var(--accent-gold)] text-[var(--accent-gold)]" />
              {product.rating.toFixed(1)} ({product.reviewCount || 0})
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-[var(--text-strong)]">{formatCurrency(product.sellingPrice)}</span>
            {product.mrp > product.sellingPrice && (
              <span className="text-[13px] text-[var(--text-subtle)] line-through">{formatCurrency(product.mrp)}</span>
            )}
          </div>

          {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
            <p className="text-[12px] font-semibold text-[#c2410c]">Only {product.stockQuantity} left in stock</p>
          )}

          <Button
            variant="primary"
            size="sm"
            fullWidth
            isLoading={isAddingToCart}
            disabled={product.stockQuantity === 0}
            onClick={handleAddToCart}
            className="mt-1"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {product.stockQuantity === 0 ? 'Out of stock' : 'Add to cart'}
          </Button>
        </div>
      </article>
    </Link>
  );
}
