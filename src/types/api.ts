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
    created_at: string;
}
