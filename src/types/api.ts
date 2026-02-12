// Types matching the actual backend API responses

// Shape returned by GET /api/products (card view)
export interface APIProductCard {
    id: string;
    name: string;
    slug: string;
    price: string;
    mrp: string;
    images: string[];
    category: string;
    wallet_eligible: boolean;
    rewards_eligible: boolean;
    stock_quantity: number;
    vendor?: {
        id: string;
        name: string;
        slug: string;
        logo_url?: string | null;
    } | null;
    category_meta?: {
        id: string;
        name: string;
        slug: string;
        parentName?: string;
        parentSlug?: string;
    } | null;
}

// Shape returned by GET /api/products/:slug (full detail)
export interface APIProductDetail {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: string;
    mrp: string;
    stock_quantity: number;
    images: string[];
    category: string;
    status: string;
    wallet_eligible: boolean;
    rewards_eligible: boolean;
    flex_collection_id: string | null;
    created_at: string;
    vendor?: {
        id: string;
        name: string;
        slug: string;
        logo_url?: string | null;
    } | null;
    category_meta?: {
        id: string;
        name: string;
        slug: string;
        parentName?: string;
        parentSlug?: string;
    } | null;
    relatedByVendor?: APIProductCard[];
}
