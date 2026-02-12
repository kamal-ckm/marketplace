'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  parent_name?: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [parentForm, setParentForm] = useState({ name: '', sort_order: 0 });
  const [childForm, setChildForm] = useState({ name: '', sort_order: 0, parentId: '' });

  const parents = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const children = useMemo(() => categories.filter((c) => !!c.parent_id), [categories]);

  async function fetchCategories() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, { headers: getAuthHeaders() as HeadersInit });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch categories.');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function createCategory(payload: { name: string; parentId?: string | null; sort_order?: number }) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(getAuthHeaders() as Record<string, string>) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed.');
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(id: string, patch: Partial<CategoryRow> & { parentId?: string | null }) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(getAuthHeaders() as Record<string, string>) },
        body: JSON.stringify({
          name: patch.name,
          parentId: patch.parentId,
          sort_order: patch.sort_order,
          is_active: patch.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed.');
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  }

  async function deleteCategory(id: string) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() as HeadersInit,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed.');
      await fetchCategories();
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
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Manage parent and child categories used by menu, home tiles, and products.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Add Parent Category</h2>
          <div className="space-y-3">
            <input
              value={parentForm.name}
              onChange={(e) => setParentForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Parent name"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#00A59B] focus:outline-none"
            />
            <input
              type="number"
              value={parentForm.sort_order}
              onChange={(e) => setParentForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))}
              placeholder="Sort order"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#00A59B] focus:outline-none"
            />
            <button
              onClick={() => {
                if (!parentForm.name.trim()) return;
                createCategory({ name: parentForm.name.trim(), sort_order: parentForm.sort_order, parentId: null });
                setParentForm({ name: '', sort_order: 0 });
              }}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00A59B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#008c84]"
            >
              <Plus size={16} /> Add Parent
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Add Child Category</h2>
          <div className="space-y-3">
            <select
              value={childForm.parentId}
              onChange={(e) => setChildForm((p) => ({ ...p, parentId: e.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#00A59B] focus:outline-none"
            >
              <option value="">Select parent category</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            <input
              value={childForm.name}
              onChange={(e) => setChildForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Child category name"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#00A59B] focus:outline-none"
            />
            <input
              type="number"
              value={childForm.sort_order}
              onChange={(e) => setChildForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))}
              placeholder="Sort order"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#00A59B] focus:outline-none"
            />
            <button
              onClick={() => {
                if (!childForm.name.trim() || !childForm.parentId) return;
                createCategory({ name: childForm.name.trim(), sort_order: childForm.sort_order, parentId: childForm.parentId });
                setChildForm({ name: '', sort_order: 0, parentId: '' });
              }}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00A59B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#008c84]"
            >
              <Plus size={16} /> Add Child
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Hierarchy</h2>
        <div className="space-y-6">
          {parents.map((parent) => (
            <div key={parent.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-slate-900">{parent.name}</span>
                <input
                  type="number"
                  value={parent.sort_order}
                  onChange={(e) => updateCategory(parent.id, { sort_order: Number(e.target.value) || 0 })}
                  className="h-8 w-20 rounded border border-slate-300 px-2 text-xs"
                />
                <label className="inline-flex items-center gap-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={parent.is_active}
                    onChange={(e) => updateCategory(parent.id, { is_active: e.target.checked })}
                    className="accent-[#00A59B]"
                  />
                  Active
                </label>
                <button onClick={() => deleteCategory(parent.id)} className="ml-auto text-red-600 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 space-y-2 pl-4 border-l border-slate-200">
                {children
                  .filter((child) => child.parent_id === parent.id)
                  .map((child) => (
                    <div key={child.id} className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-800">{child.name}</span>
                      <input
                        type="number"
                        value={child.sort_order}
                        onChange={(e) => updateCategory(child.id, { sort_order: Number(e.target.value) || 0 })}
                        className="h-8 w-20 rounded border border-slate-300 px-2 text-xs"
                      />
                      <label className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={child.is_active}
                          onChange={(e) => updateCategory(child.id, { is_active: e.target.checked })}
                          className="accent-[#00A59B]"
                        />
                        Active
                      </label>
                      <button onClick={() => deleteCategory(child.id)} className="ml-auto text-red-600 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
