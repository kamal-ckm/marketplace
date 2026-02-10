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
            <div className={cn(
                'group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden',
                className
            )}>
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                    {product.badges?.includes('wallet_eligible') && (
                        <span className="badge badge-wallet text-xs">
                            💳 Wallet Eligible
                        </span>
                    )}
                    {product.badges?.includes('bestseller') && (
                        <span className="badge bg-accent-gold text-white text-xs">
                            ⭐ Bestseller
                        </span>
                    )}
                    {product.badges?.includes('new') && (
                        <span className="badge badge-new text-xs">
                            ✨ New
                        </span>
                    )}
                    {discountPercentage > 0 && (
                        <span className="badge badge-sale text-xs font-bold">
                            {discountPercentage}% OFF
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={handleToggleWishlist}
                    className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
                    aria-label="Add to wishlist"
                >
                    <Heart
                        className={cn(
                            'w-5 h-5 transition-colors',
                            isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
                        )}
                    />
                </button>

                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {product.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">Out of Stock</span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                    {/* Vendor Name */}
                    {product.vendor && (
                        <p className="text-xs text-gray-500 mb-1">{product.vendor.name}</p>
                    )}

                    {/* Product Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating && (
                        <div className="flex items-center gap-1 mb-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            'w-4 h-4',
                                            i < Math.floor(product.rating!)
                                                ? 'fill-accent-gold text-accent-gold'
                                                : 'text-gray-300'
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">
                                ({product.reviewCount || 0})
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(product.sellingPrice)}
                        </span>
                        {product.mrp > product.sellingPrice && (
                            <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(product.mrp)}
                            </span>
                        )}
                    </div>

                    {/* Stock Status */}
                    {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                        <p className="text-sm text-orange-600 mb-3">
                            Only {product.stockQuantity} left in stock!
                        </p>
                    )}

                    {/* Add to Cart Button */}
                    <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        isLoading={isAddingToCart}
                        disabled={product.stockQuantity === 0}
                        onClick={handleAddToCart}
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                </div>
            </div>
        </Link>
    );
}
