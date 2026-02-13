'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type EntryMode = 'demo' | 'healthi';

export function getEntryMode(): EntryMode {
  const mode = (process.env.NEXT_PUBLIC_ENTRY_MODE || 'demo').toLowerCase();
  return mode === 'healthi' ? 'healthi' : 'demo';
}

export interface HealthiEmployee {
  id?: string;
  name?: string;
  email?: string;
}

export interface HealthiDependent {
  id: string;
  name: string;
  type: 'self' | 'dependent';
}

export interface HealthiSession {
  token: string;
  employee: HealthiEmployee;
  dependents: HealthiDependent[];
}

interface HealthiSessionContextType {
  session: HealthiSession | null;
  isReady: boolean;
  setSession: (session: HealthiSession | null) => void;
  clearSession: () => void;
}

const STORAGE_KEY = 'healthi_session_v1';

const HealthiSessionContext = createContext<HealthiSessionContextType>({
  session: null,
  isReady: false,
  setSession: () => {},
  clearSession: () => {},
});

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function maybeDecodeBase64(value: string): string | null {
  try {
    // If it's already JSON, return as-is.
    if (value.trim().startsWith('{') || value.trim().startsWith('[')) return value;
    // atob expects base64 without URL-safe chars.
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return atob(normalized);
  } catch {
    return null;
  }
}

function normalizeDependents(raw: any, employee: HealthiEmployee): HealthiDependent[] {
  const list: HealthiDependent[] = [];

  // Always include Self as first option (default).
  const selfName = employee?.name || 'Self';
  list.push({ id: 'self', name: selfName, type: 'self' });

  if (Array.isArray(raw)) {
    for (const d of raw) {
      if (!d) continue;
      const id = String(d.id || d.dependentId || '').trim();
      const name = String(d.name || d.dependentName || '').trim();
      if (!id || !name) continue;
      list.push({ id, name, type: 'dependent' });
    }
  }

  return list;
}

export function HealthiSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<HealthiSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  function setSession(next: HealthiSession | null) {
    setSessionState(next);
    if (typeof window === 'undefined') return;
    if (!next) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clearSession() {
    setSession(null);
  }

  useEffect(() => {
    // 1) Restore from localStorage
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const parsed = safeJsonParse<HealthiSession>(stored);
      if (parsed?.token) {
        setSessionState(parsed);
      }
    }

    // 2) Capture from query params (deep link from Healthi app)
    const url = new URL(window.location.href);
    const token = url.searchParams.get('healthi_token') || '';
    const userParam = url.searchParams.get('healthi_user') || '';

    if (token) {
      const decoded = userParam ? (maybeDecodeBase64(userParam) || decodeURIComponent(userParam)) : '';
      const user = decoded ? safeJsonParse<any>(decoded) : null;

      const employee: HealthiEmployee = {
        id: user?.employee?.id || user?.employeeId || user?.id,
        name: user?.employee?.name || user?.employeeName || user?.name,
        email: user?.employee?.email || user?.email,
      };

      const dependents = normalizeDependents(user?.dependents || user?.family || user?.beneficiaries, employee);

      setSessionState({ token, employee, dependents });

      // Persist and remove sensitive params from URL
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token, employee, dependents }),
      );
      url.searchParams.delete('healthi_token');
      url.searchParams.delete('healthi_user');
      window.history.replaceState({}, '', url.toString());
    }

    setIsReady(true);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isReady,
      setSession,
      clearSession,
    }),
    [session, isReady],
  );

  return <HealthiSessionContext.Provider value={value}>{children}</HealthiSessionContext.Provider>;
}

export function useHealthiSession() {
  return useContext(HealthiSessionContext);
}

