import { MENU_CATEGORIES } from '@/lib/categories';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export type TaxonomyChild = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type TaxonomyParent = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  children: TaxonomyChild[];
};

export type VendorOption = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  is_active?: boolean;
};

function fallbackTree(): TaxonomyParent[] {
  return MENU_CATEGORIES.map((parent, parentIdx) => ({
    id: parent.slug,
    name: parent.name,
    slug: parent.slug,
    sort_order: parentIdx + 1,
    children: parent.sub.map((child, childIdx) => ({
      id: child.slug,
      name: child.name,
      slug: child.slug,
      sort_order: childIdx + 1,
    })),
  }));
}

export async function fetchCategoryTree(): Promise<TaxonomyParent[]> {
  try {
    const res = await fetch(`${API_BASE}/api/categories/tree`);
    if (!res.ok) return fallbackTree();
    const data = await res.json();
    return Array.isArray(data) ? data : fallbackTree();
  } catch {
    return fallbackTree();
  }
}

export async function fetchVendors(): Promise<VendorOption[]> {
  try {
    const res = await fetch(`${API_BASE}/api/vendors`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
