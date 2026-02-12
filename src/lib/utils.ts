import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function calculateDiscount(price: number | string, mrp: number | string) {
  const selling = typeof price === 'string' ? parseFloat(price) : price;
  const original = typeof mrp === 'string' ? parseFloat(mrp) : mrp;
  if (!original || original <= selling) return 0;
  return Math.round(((original - selling) / original) * 100);
}
