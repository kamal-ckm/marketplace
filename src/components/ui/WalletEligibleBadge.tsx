'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WalletEligibleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]',
        className,
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      Wallet eligible
    </span>
  );
}

