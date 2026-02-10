'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ArrowLeft, Package, Loader2, ShoppingCart, Heart, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { APIProductDetail } from '@/types/api';
import { useCart } from '@/lib/cart-context';
import { useCustomerAuth } from '@/lib/auth-customer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { addToCart } = useCart();
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
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        setAdding(true);
        const res = await addToCart(product!.id, 1);
        setAdding(false);

        if (res.success) {
            // Maybe show toast? For now, button provides feedback via 'Done' or context updates header
        } else {
            alert(res.error);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center py-32">
                    <Loader2 size={40} className="animate-spin text-[#00A59B]" />
                </div>
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-24">
                    <div className="max-w-md mx-auto text-center">
                        <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Package size={40} className="text-slate-400" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Raleway' }}>
                            Product Not Found
                        </h1>
                        <p className="text-slate-500 mb-8">
                            The product you're looking for doesn't exist or is not available yet.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-[#00A59B] hover:bg-[#008C84] text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Homepage
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
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-4">
                <nav className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/" className="hover:text-[#00A59B] transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium truncate max-w-[200px]">{product.name}</span>
                </nav>
            </div>

            <div className="container mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    <div>
                        <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200 mb-4">
                            {hasImages ? (
                                <>
                                    <img
                                        src={images[selectedImage]}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-4"
                                    />
                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
                                            >
                                                <ChevronLeft size={20} className="text-slate-700" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
                                            >
                                                <ChevronRight size={20} className="text-slate-700" />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package size={80} className="text-slate-200" strokeWidth={1} />
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImage
                                            ? 'border-[#00A59B] shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#00A59B]/10 text-[#00A59B] mb-4">
                            {product.category}
                        </span>

                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Raleway' }}>
                            {product.name}
                        </h1>

                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-4xl font-bold text-slate-900">
                                ₹{price.toLocaleString('en-IN')}
                            </span>
                            {mrp > price && (
                                <>
                                    <span className="text-xl text-slate-400 line-through">
                                        ₹{mrp.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                        Save {discount}%
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="text-sm text-slate-500 mb-6">Inclusive of all taxes</p>

                        {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                            <p className="text-sm text-orange-600 font-medium mb-4">
                                ⚡ Only {product.stock_quantity} left in stock!
                            </p>
                        )}

                        <hr className="border-slate-200 mb-6" />

                        {product.description && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-slate-900 mb-3">Description</h2>
                                <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mb-8">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock_quantity === 0 || adding}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#00A59B] hover:bg-[#008C84] text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {adding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>

                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-slate-100">
                                <Truck size={24} className="text-[#00A59B] mb-2" />
                                <span className="text-xs font-medium text-slate-700">Free Delivery</span>
                            </div>
                            <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-slate-100">
                                <Shield size={24} className="text-[#00A59B] mb-2" />
                                <span className="text-xs font-medium text-slate-700">Genuine Product</span>
                            </div>
                            <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-slate-100">
                                <RotateCcw size={24} className="text-[#00A59B] mb-2" />
                                <span className="text-xs font-medium text-slate-700">Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="bg-gray-900 text-white py-8">
                <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
                    <p>&copy; 2026 Healthi Marketplace. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
