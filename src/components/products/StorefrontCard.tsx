'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import type { APIProductCard } from '@/types/api';

interface StorefrontCardProps {
    product: APIProductCard;
}

export function StorefrontCard({ product }: StorefrontCardProps) {
    const price = parseFloat(product.price);
    const mrp = parseFloat(product.mrp);
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const mainImage = product.images?.[0] || null;

    return (
        <Link href={`/products/${product.slug}`}>
            <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100">
                {/* Image */}
                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package size={48} className="text-slate-300" strokeWidth={1} />
                        </div>
                    )}

                    {/* Discount Badge */}
                    {discount > 0 && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            {discount}% OFF
                        </span>
                    )}

                    {/* Category Tag */}
                    <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                        {product.category}
                    </span>
                </div>

                {/* Info */}
                <div className="p-4">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[#00A59B] transition-colors mb-3 min-h-[2.5rem]">
                        {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {mrp > price && (
                            <span className="text-sm text-slate-400 line-through">
                                ₹{mrp.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
