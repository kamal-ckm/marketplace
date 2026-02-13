'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';
import { Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function EditProductPage() {
    const params = useParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<ProductFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
                    headers: getAuthHeaders() as HeadersInit,
                });
                if (!res.ok) {
                    throw new Error('Product not found');
                }
                const data = await res.json();
                setProduct({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    description: data.description || '',
                    price: data.price,
                    mrp: data.mrp,
                    stock_quantity: String(data.stock_quantity),
                    images: data.images || [],
                    category: data.category,
                    status: data.status,
                    // Wallet eligibility is controlled by Flex Collection ID.
                    wallet_eligible: Boolean(String(data.flex_collection_id ?? '').trim()),
                    rewards_eligible: data.rewards_eligible ?? true,
                    flex_collection_id: data.flex_collection_id ?? '',
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load product';
                setError(message);
            } finally {
                setLoading(false);
            }
        }

        if (productId) fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={32} className="animate-spin text-[#00A59B]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <p className="text-lg font-medium">Product not found</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    return <ProductForm initialData={product} mode="edit" />;
}
