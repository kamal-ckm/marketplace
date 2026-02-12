'use client';

import { Button } from '../ui/Button';

interface CouponCardProps {
  deal: {
    id: string;
    title: string;
    description?: string;
    price: number;
    image: string;
    brand: string;
    isFree?: boolean;
  };
}

export function CouponCard({ deal }: CouponCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative m-3 aspect-[4/3] overflow-hidden rounded-xl bg-[var(--surface-alt)]">
        <img
          src={deal.image}
          alt={deal.brand}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {deal.isFree && (
          <span className="absolute left-3 top-3 rounded-md bg-[var(--accent-gold)] px-2.5 py-1 text-[11px] font-bold text-black">
            FREE
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-subtle)]">{deal.brand}</p>
        <h3
          className="mt-1 line-clamp-2 min-h-[44px] text-[17px] font-semibold leading-6 text-[var(--text-strong)]"
          style={{ fontFamily: 'Raleway' }}
        >
          {deal.title}
        </h3>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-subtle)]">Coupon price</p>
            <p className="text-[22px] font-bold text-[var(--text-strong)]">₹{deal.price}</p>
          </div>
          <span className="text-[12px] font-semibold text-[var(--primary)]">Limited offer</span>
        </div>

        <Button variant="outline" className="mt-4 w-full">
          Buy coupon
        </Button>
      </div>
    </article>
  );
}
