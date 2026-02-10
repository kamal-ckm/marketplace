// User & Auth Types
export interface User {
    id: string;
    healthiUserId: string;
    employerId: string;
    name: string;
    email: string;
    phone?: string;
    walletBalance: number;
    rewardsBalance: number;
    createdAt: Date;
}

export interface Beneficiary {
    id: string;
    userId: string;
    type: 'self' | 'spouse' | 'child' | 'parent';
    name: string;
    relationship: string;
    dateOfBirth?: Date;
}

// Product Types
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    type: 'physical' | 'digital_coupon' | 'service';
    sku: string;
    mrp: number;
    sellingPrice: number;
    stockQuantity: number;
    vendorId: string;
    vendor?: Vendor;
    categoryIds: string[];
    categories?: Category[];
    images: ProductImage[];
    flexCollectionId: string;
    walletEligible: boolean;
    rewardsEligible: boolean;
    status: 'draft' | 'live' | 'out_of_stock' | 'discontinued';
    badges?: ProductBadge[];
    rating?: number;
    reviewCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductImage {
    id: string;
    productId: string;
    url: string;
    alt: string;
    sortOrder: number;
}

export type ProductBadge = 'wallet_eligible' | 'bestseller' | 'new' | 'sale' | 'low_stock';

export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    name: string;
    price: number;
    mrp: number;
    stock: number;
    attributes: Record<string, string>; // e.g., { size: 'L', color: 'Blue' }
}

// Category Types
export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    image?: string;
    icon?: string;
    flexCollectionId?: string;
    sortOrder: number;
    status: 'active' | 'inactive';
}

// Vendor Types
export interface Vendor {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    gst: string;
    bankDetails?: BankDetails;
    commission: number;
    status: 'active' | 'suspended' | 'pending';
    rating?: number;
    createdAt: Date;
}

export interface BankDetails {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    bankName: string;
}

// Cart Types
export interface CartItem {
    id: string;
    userId: string;
    productId: string;
    product: Product;
    variantId?: string;
    variant?: ProductVariant;
    quantity: number;
    createdAt: Date;
}

export interface Cart {
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    walletApplied: number;
    rewardsApplied: number;
    cashRequired: number;
}

// Order Types
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    user?: User;
    beneficiaryId: string;
    beneficiary?: Beneficiary;
    status: OrderStatus;
    items: OrderItem[];
    shippingAddress: Address;
    billingAddress: Address;
    subtotal: number;
    discount: number;
    tax: number;
    shippingFee: number;
    total: number;
    walletAmount: number;
    rewardsAmount: number;
    cashAmount: number;
    paymentId?: string;
    paymentStatus: PaymentStatus;
    timeline: OrderTimeline[];
    createdAt: Date;
    updatedAt: Date;
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    product: Product;
    variantId?: string;
    variant?: ProductVariant;
    quantity: number;
    price: number;
    vendorId: string;
    vendor?: Vendor;
}

export interface OrderTimeline {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
    updatedBy?: string;
}

export interface Address {
    id?: string;
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
}

// Coupon Types
export interface Coupon {
    id: string;
    code: string;
    productId?: string;
    product?: Product;
    description: string;
    type: 'product_coupon' | 'discount_code';
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number;
    expiresAt?: Date;
    redemptionLimit?: number;
    redemptionCount: number;
    status: 'active' | 'expired' | 'used';
}

// CMS Types
export interface Banner {
    id: string;
    title: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    position: 'hero' | 'mid_page' | 'footer';
    startDate?: Date;
    endDate?: Date;
    sortOrder: number;
    status: 'active' | 'scheduled' | 'inactive';
}

export interface Page {
    id: string;
    title: string;
    slug: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    status: 'draft' | 'published';
}

// Analytics Types
export interface AnalyticsStats {
    totalOrders: number;
    totalRevenue: number;
    walletUtilization: number;
    rewardsUtilization: number;
    averageOrderValue: number;
    conversionRate: number;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiError {
    error: string;
    message: string;
    statusCode: number;
}

// Filter & Sort Types
export interface ProductFilters {
    categoryId?: string;
    vendorId?: string;
    minPrice?: number;
    maxPrice?: number;
    walletEligible?: boolean;
    inStock?: boolean;
    search?: string;
    badges?: ProductBadge[];
}

export interface SortOption {
    field: 'price' | 'name' | 'rating' | 'createdAt';
    direction: 'asc' | 'desc';
}
