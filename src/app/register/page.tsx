'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/auth-customer';
import { getEntryMode, useHealthiSession } from '@/lib/healthi-session';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useCustomerAuth();
  const { session: healthiSession } = useHealthiSession();
  const entryMode = getEntryMode();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isHealthiEntry = entryMode === 'healthi';
  const hasHealthiSession = Boolean(healthiSession?.token);
  const shouldBlock = isHealthiEntry && !hasHealthiSession;
  const shouldRedirectHome = (isHealthiEntry && hasHealthiSession) || (!isHealthiEntry && isAuthenticated);

  useEffect(() => {
    if (shouldRedirectHome) router.replace('/');
  }, [router, shouldRedirectHome]);

  if (shouldBlock) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
          <h1 className="text-[22px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
            Create account
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-subtle)]">
            Accounts are managed in the Healthi app. Please open the marketplace from Healthi to continue.
          </p>
          <div className="mt-6">
            <Link href="/">
              <Button fullWidth>Go to homepage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (shouldRedirectHome) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await register(name, email, password);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Registration failed');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-lg font-bold text-white">H</div>
          <span className="text-2xl font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
            Healthi
          </span>
        </Link>

        <h1 className="text-center text-[30px] font-bold text-[var(--text-strong)]" style={{ fontFamily: 'Raleway' }}>
          Create account
        </h1>
        <p className="mt-1 text-center text-[14px] text-[var(--text-subtle)]">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Sign in
          </Link>
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>}

          <div>
            <label htmlFor="name" className="mb-1 block text-[13px] font-semibold text-[var(--text-body)]">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-[14px] text-[var(--text-strong)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-[13px] font-semibold text-[var(--text-body)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-[14px] text-[var(--text-strong)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-[13px] font-semibold text-[var(--text-body)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-[14px] text-[var(--text-strong)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-[13px] font-semibold text-[var(--text-body)]">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-[14px] text-[var(--text-strong)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <Button type="submit" isLoading={loading} fullWidth>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
