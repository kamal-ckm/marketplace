'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

type VendorRow = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  is_active: boolean;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', logo_url: '' });

  async function fetchVendors() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/vendors`, { headers: getAuthHeaders() as HeadersInit });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch vendors.');
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVendors();
  }, []);

  async function createVendor() {
    if (!form.name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(getAuthHeaders() as Record<string, string>) },
        body: JSON.stringify({ name: form.name.trim(), logo_url: form.logo_url.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed.');
      setForm({ name: '', logo_url: '' });
      await fetchVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    }
  }

  async function updateVendor(id: string, patch: Partial<VendorRow>) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(getAuthHeaders() as Record<string, string>) },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed.');
      await fetchVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  }

  async function deleteVendor(id: string) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/vendors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as HeadersInit,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed.');
      await fetchVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={30} className="animate-spin text-[#00A59B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendors / Brands</h1>
        <p className="text-sm text-slate-500 mt-1">Manage vendor list used in product tagging and storefront filters.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Add Vendor</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Vendor name"
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#00A59B] focus:outline-none"
          />
          <input
            value={form.logo_url}
            onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
            placeholder="Logo URL (optional)"
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#00A59B] focus:outline-none"
          />
          <button onClick={createVendor} className="inline-flex items-center gap-2 rounded-lg bg-[#00A59B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#008c84]">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Vendor List</h2>
        <div className="space-y-3">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
              <input
                value={vendor.name}
                onChange={(e) => setVendors((prev) => prev.map((item) => (item.id === vendor.id ? { ...item, name: e.target.value } : item)))}
                onBlur={() => updateVendor(vendor.id, { name: vendor.name })}
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
              <input
                value={vendor.logo_url || ''}
                onChange={(e) => setVendors((prev) => prev.map((item) => (item.id === vendor.id ? { ...item, logo_url: e.target.value } : item)))}
                onBlur={() => updateVendor(vendor.id, { logo_url: vendor.logo_url || null })}
                placeholder="Logo URL"
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={vendor.is_active}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setVendors((prev) => prev.map((item) => (item.id === vendor.id ? { ...item, is_active: checked } : item)));
                    updateVendor(vendor.id, { is_active: checked });
                  }}
                  className="accent-[#00A59B]"
                />
                Active
              </label>
              <button onClick={() => deleteVendor(vendor.id)} className="justify-self-end text-red-600 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
