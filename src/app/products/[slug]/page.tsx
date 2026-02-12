'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, Package, Loader2, ShoppingCart, Heart, Truck, Shield, RotateCcw, ChevronRight, Star } from 'lucide-react';
import type { APIProductDetail } from '@/types/api';
import { useCart } from '@/lib/cart-context';
import { useCustomerAuth } from '@/lib/auth-customer';
import { Button } from '@/components/ui/Button';
import { StorefrontCard } from '@/components/products/StorefrontCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { addToCart, setIsCartOpen } = useCart();
  const { isAuthenticated } = useCustomerAuth();

  const [product, setProduct] = useState<APIProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`${API_BASE}/api/products/${slug}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchProduct();
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-[var(--primary)]" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <div className="site-container py-20">
          <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-alt)]">
              <Package size={28} className="text-slate-400" />
            </div>
            <h1 className="text-[26px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
              Product not found
            </h1>
            <p className="mt-2 text-[14px] text-[var(--text-subtle)]">
              This product is unavailable or the link is invalid.
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button>
                <ArrowLeft size={16} className="mr-2" />
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const price = parseFloat(product.price);
  const mrp = parseFloat(product.mrp);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="site-container py-8">
        <div className="mb-6 flex items-center gap-2 text-[13px] text-[var(--text-subtle)]">
          <Link href="/" className="hover:text-[var(--primary)]">Home</Link>
          <ChevronRight size={13} />
          <span className="truncate text-[var(--text-body)]">{product.name}</span>
        </div>

        <section className="grid gap-8 rounded-2xl border border-[var(--border)] bg-white p-6 md:grid-cols-2 md:p-8">
          <div>
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-alt)] p-6">
              {hasImages ? (
                <img src={images[selectedImage]} alt={product.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-center text-[var(--text-subtle)]">
                  <Package size={48} className="mx-auto mb-2 text-slate-300" />
                  No image available
                </div>
              )}

              {discount > 0 && (
                <span className="absolute left-4 top-4 rounded-md bg-[var(--primary)] px-2.5 py-1 text-[12px] font-semibold text-white">
                  {discount}% OFF
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border p-1 ${
                      index === selectedImage ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)]'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-subtle)]">{product.category}</p>
            <h1 className="mt-1 text-[34px] font-bold leading-tight text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
              {product.name}
            </h1>
            {product.vendor?.name && (
              <p className="mt-2 text-[13px] font-semibold text-[var(--primary)]">Brand: {product.vendor.name}</p>
            )}

            <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--text-subtle)]">
              <Star size={14} className="text-[var(--accent-gold)]" fill="var(--accent-gold)" />
              4.5 rating • 145 reviews
            </div>

            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-[34px] font-bold text-[var(--text-strong)]">₹{price.toLocaleString('en-IN')}</span>
                {mrp > price && <span className="text-[16px] text-[var(--text-subtle)] line-through">₹{mrp.toLocaleString('en-IN')}</span>}
              </div>
              <p className="text-[13px] text-[var(--text-subtle)]">Inclusive of taxes</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--border)] bg-white p-3 text-center text-[12px] text-[var(--text-body)]">
                  <Truck size={15} className="mx-auto mb-1 text-[var(--primary)]" />
                  Fast shipping
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-white p-3 text-center text-[12px] text-[var(--text-body)]">
                  <Shield size={15} className="mx-auto mb-1 text-[var(--primary)]" />
                  Secure checkout
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-white p-3 text-center text-[12px] text-[var(--text-body)]">
                  <RotateCcw size={15} className="mx-auto mb-1 text-[var(--primary)]" />
                  Easy returns
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || adding}
                className="flex-1"
                size="lg"
              >
                {adding ? <Loader2 size={18} className="mr-2 animate-spin" /> : <ShoppingCart size={18} className="mr-2" />}
                {product.stock_quantity === 0 ? 'Out of stock' : 'Add to cart'}
              </Button>
              <Button variant="outline" size="lg" className="px-4" aria-label="Save to wishlist">
                <Heart size={18} />
              </Button>
            </div>

            {product.wallet_eligible && (
              <p className="mt-4 inline-flex rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--primary)]">
                Wallet eligible product
              </p>
            )}

            <div className="mt-7 border-t border-[var(--border)] pt-5">
              <h2 className="text-[17px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
                Product details
              </h2>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-6 text-[var(--text-body)]">
                {product.description || 'No details provided.'}
              </p>
            </div>
          </div>
        </section>

        {product.relatedByVendor && product.relatedByVendor.length > 0 && product.vendor?.slug !== 'unbranded' && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[26px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
                More from {product.vendor?.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.relatedByVendor.map((item) => (
                <StorefrontCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
