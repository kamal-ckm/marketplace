import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60';

    const variants = {
      primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]',
      secondary: 'bg-[var(--surface-alt)] text-[var(--text-strong)] hover:bg-[#e8ece9]',
      outline: 'border border-[var(--border)] bg-white text-[var(--text-strong)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
      ghost: 'bg-transparent text-[var(--text-strong)] hover:bg-[var(--surface-alt)]',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
      sm: 'h-9 px-4 text-[13px]',
      md: 'h-11 px-5 text-[14px]',
      lg: 'h-12 px-6 text-[15px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
