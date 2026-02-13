'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, ImageIcon, ArrowLeft, Loader2, Save, Globe } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CATEGORIES = ['Fitness', 'Nutrition', 'Medical', 'Wellness', 'Personal Care'];

export interface ProductFormData {
    id?: string;
    name: string;
    slug: string;
    description: string;
    price: string;
    mrp: string;
    stock_quantity: string;
    images: string[];
    category: string;
    status: string;
    wallet_eligible: boolean;
    rewards_eligible: boolean;
    flex_collection_id: string;
}

interface ProductFormProps {
    initialData?: ProductFormData;
    mode: 'create' | 'edit';
}

export default function ProductForm({ initialData, mode }: ProductFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<ProductFormData>(
        initialData
            ? {
                  ...initialData,
                  // Wallet eligibility is controlled by Flex Collection ID.
                  wallet_eligible: Boolean(initialData.flex_collection_id?.trim()),
              }
            : {
                  name: '',
                  slug: '',
                  description: '',
                  price: '',
                  mrp: '',
                  stock_quantity: '',
                  images: [],
                  category: '',
                  status: 'DRAFT',
                  wallet_eligible: false,
                  rewards_eligible: true,
                  flex_collection_id: '',
              }
    );

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Auto-generate slug from name (only on create, or if slug is empty)
    function handleNameChange(name: string) {
        setForm((prev) => ({
            ...prev,
            name,
            ...(mode === 'create' || !prev.slug
                ? { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
                : {}),
        }));
    }

    function handleChange(field: keyof ProductFormData, value: string) {
        if (field === 'flex_collection_id') {
            const trimmed = value.trim();
            setForm((prev) => ({
                ...prev,
                flex_collection_id: value,
                // Wallet eligibility is derived from Flex Collection ID.
                wallet_eligible: Boolean(trimmed),
            }));
            return;
        }

        setForm((prev) => ({ ...prev, [field]: value }));
    }

    // Image Upload
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check type
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setError('Only JPG and PNG images are allowed.');
            return;
        }

        // Check size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB.');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                headers: { ...getAuthHeaders() }, // Auth required for upload
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Upload failed');
            }

            const data = await res.json();
            setForm((prev) => ({ ...prev, images: [...prev.images, data.url] }));
        } catch (err: any) {
            setError(err.message || 'Image upload failed.');
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    function removeImage(index: number) {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    }

    // Save Product
    async function handleSave(publishAfterSave = false) {
        // Validation
        if (!form.name.trim()) return setError('Product name is required.');
        if (!form.price || parseFloat(form.price) <= 0) return setError('Price must be greater than 0.');
        if (!form.mrp || parseFloat(form.mrp) <= 0) return setError('MRP must be greater than 0.');
        if (!form.category) return setError('Category is required.');
        if (form.stock_quantity && parseInt(form.stock_quantity) < 0) return setError('Stock cannot be negative.');

        setSaving(true);
        setError('');

        try {
            const derivedWalletEligible = Boolean(form.flex_collection_id?.trim());

            const payload = {
                name: form.name,
                description: form.description,
                price: parseFloat(form.price),
                mrp: parseFloat(form.mrp),
                stock_quantity: parseInt(form.stock_quantity) || 0,
                images: form.images,
                category: form.category,
                status: publishAfterSave ? 'PUBLISHED' : form.status,
                // Wallet eligibility is controlled by Flex Collection ID.
                wallet_eligible: derivedWalletEligible,
                rewards_eligible: form.rewards_eligible,
                flex_collection_id: form.flex_collection_id,
                ...(mode === 'create' && form.slug ? { slug: form.slug } : {}),
            };

            let res: Response;

            if (mode === 'create') {
                res = await fetch(`${API_BASE}/api/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch(`${API_BASE}/api/products/${form.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Save failed');
            }

            router.push('/admin');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-4xl">
            {/* Back Button */}
            <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Products
            </button>

            {/* Page Title */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Raleway, sans-serif' }}>
                    {mode === 'create' ? 'Add New Product' : `Edit: ${initialData?.name || ''}`}
                </h1>
                {mode === 'edit' && (
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${form.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/10'
                            }`}
                    >
                        {form.status === 'PUBLISHED' ? '● Published' : '● Draft'}
                    </span>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                    {error}
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Form Grid */}
            <div className="space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="product-name" className="block text-sm font-medium text-slate-700 mb-1">
                                Product Name *
                            </label>
                            <input
                                id="product-name"
                                type="text"
                                value={form.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. Premium Yoga Mat"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label htmlFor="product-slug" className="block text-sm font-medium text-slate-700 mb-1">
                                URL Slug
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">/products/</span>
                                <input
                                    id="product-slug"
                                    type="text"
                                    value={form.slug}
                                    onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="premium-yoga-mat"
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors"
                                    readOnly={mode === 'edit'}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="product-description" className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="product-description"
                                value={form.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Describe your product..."
                                rows={5}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Pricing & Inventory</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="product-price" className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹) *</label>
                            <input
                                id="product-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={(e) => handleChange('price', e.target.value)}
                                placeholder="1499"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="product-mrp" className="block text-sm font-medium text-slate-700 mb-1">MRP (₹) *</label>
                            <input
                                id="product-mrp"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.mrp}
                                onChange={(e) => handleChange('mrp', e.target.value)}
                                placeholder="2000"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="product-stock" className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                            <input
                                id="product-stock"
                                type="number"
                                min="0"
                                value={form.stock_quantity}
                                onChange={(e) => handleChange('stock_quantity', e.target.value)}
                                placeholder="100"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Category Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Category</h2>
                    <div>
                        <label htmlFor="product-category" className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                        <select
                            id="product-category"
                            value={form.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors"
                        >
                            <option value="">Select a category</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Images Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Images</h2>

                    {/* Image Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        {form.images.map((url, index) => (
                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                                {index === 0 && (
                                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                                        Primary
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Upload Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-[#00A59B] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#00A59B] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {uploading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <Upload size={20} />
                                    <span className="text-xs font-medium">Upload</span>
                                </>
                            )}
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <p className="text-xs text-slate-400">JPG or PNG, max 5MB. First image is the primary display image.</p>
                </div>

                {/* Benefits Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Benefits & Eligibility</h2>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900">Wallet Eligible</h3>
                                <p className="text-xs text-slate-500">Enabled only when Flex Collection ID is set</p>
                            </div>
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${form.flex_collection_id?.trim()
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                    : 'bg-slate-100 text-slate-600 ring-slate-500/10'
                                    }`}
                            >
                                {form.flex_collection_id?.trim() ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900">Rewards Eligible</h3>
                                <p className="text-xs text-slate-500">Allow customers to redeem rewards (₹)</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.rewards_eligible}
                                onChange={(e) => setForm(prev => ({ ...prev, rewards_eligible: e.target.checked }))}
                                className="w-5 h-5 accent-[#00A59B]"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="flex-collection" className="block text-sm font-medium text-slate-700 mb-1">Flex Collection ID</label>
                        <input
                            id="flex-collection"
                            type="text"
                            value={form.flex_collection_id}
                            onChange={(e) => handleChange('flex_collection_id', e.target.value)}
                            placeholder="e.g. FLEX_FITNESS_001"
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A59B]/30 focus:border-[#00A59B] transition-colors"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            This controls both wallet eligibility and which employer benefit bucket/program rules this product belongs to (entitlement validation).
                            Leave blank if the product should be purchased only via personal payment and/or rewards.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-6">
                    <button
                        onClick={() => router.push('/admin')}
                        className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <div className="flex items-center gap-3">
                        {/* Save as Draft */}
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {mode === 'create' ? 'Save as Draft' : 'Save'}
                        </button>

                        {/* Publish */}
                        {(mode === 'edit' && form.status !== 'PUBLISHED') || mode === 'create' ? (
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#00A59B] hover:bg-[#008C84] text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                                Publish
                            </button>
                        ) : null}

                        {/* Unpublish */}
                        {mode === 'edit' && form.status === 'PUBLISHED' ? (
                            <button
                                onClick={() => {
                                    setForm((prev) => ({ ...prev, status: 'DRAFT' }));
                                    handleSave(false);
                                }}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors ring-1 ring-amber-600/20 disabled:opacity-50"
                            >
                                Unpublish
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
