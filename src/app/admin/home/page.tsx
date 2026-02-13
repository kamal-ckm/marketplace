'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, RotateCcw, Trash2, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DEFAULT_HOME_CUSTOMIZATION,
  HOME_CUSTOMIZATION_STORAGE_KEY,
  HomeCustomization,
  HomeSlide,
  parseHomeCustomization,
} from '@/lib/home-customization';
import { getAuthHeaders } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

function createEmptySlide(): HomeSlide {
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tagText: 'Featured campaign',
    heading: 'New Slide Heading',
    body: 'Add supporting copy for this slide.',
    buttonText: 'Shop Now',
    buttonLink: '/categories/all',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600',
    badgeText: 'Save Up to 50%',
  };
}

export default function AdminHomeCustomizationPage() {
  const initial = useMemo<HomeCustomization>(() => {
    if (typeof window === 'undefined') return DEFAULT_HOME_CUSTOMIZATION;
    return parseHomeCustomization(localStorage.getItem(HOME_CUSTOMIZATION_STORAGE_KEY));
  }, []);

  const [config, setConfig] = useState<HomeCustomization>(initial);
  const [savedAt, setSavedAt] = useState<string>('');
  const [loadingRemote, setLoadingRemote] = useState<boolean>(true);
  const [saveError, setSaveError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  function updateSlide(slideId: string, field: keyof HomeSlide, value: string) {
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((slide) => (slide.id === slideId ? { ...slide, [field]: value } : slide)),
    }));
  }

  function addSlide() {
    setConfig((prev) => ({
      ...prev,
      slides: [...prev.slides, createEmptySlide()],
    }));
  }

  function removeSlide(slideId: string) {
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.filter((slide) => slide.id !== slideId),
    }));
  }

  useEffect(() => {
    async function loadRemote() {
      setLoadingRemote(true);
      setSaveError('');
      try {
        const res = await fetch(`${API_BASE}/api/admin/home-customization`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });

        if (!res.ok) {
          setLoadingRemote(false);
          return;
        }

        const data = await res.json();
        const parsed = parseHomeCustomization(JSON.stringify(data));
        setConfig(parsed);
        localStorage.setItem(HOME_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Fallback stays as localStorage/default.
      } finally {
        setLoadingRemote(false);
      }
    }

    loadRemote();
  }, []);

  async function saveConfig() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/home-customization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.error || 'Failed to save. Please try again.');
        return;
      }

      const parsed = parseHomeCustomization(JSON.stringify(data));
      setConfig(parsed);
      localStorage.setItem(HOME_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(parsed));
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSlideImageUpload(slideId: string, file: File | null) {
    if (!file) return;
    setUploadError('');
    setUploadingSlideId(slideId);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: getAuthHeaders() as HeadersInit,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Image upload failed');
        return;
      }

      updateSlide(slideId, 'imageUrl', data.url);
    } catch {
      setUploadError('Image upload failed. Please try again.');
    } finally {
      setUploadingSlideId(null);
    }
  }

  async function resetDefault() {
    setConfig(DEFAULT_HOME_CUSTOMIZATION);
    localStorage.setItem(HOME_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(DEFAULT_HOME_CUSTOMIZATION));
    setSavedAt(new Date().toLocaleTimeString());
    try {
      await fetch(`${API_BASE}/api/admin/home-customization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(DEFAULT_HOME_CUSTOMIZATION),
      });
    } catch {
      // Keep local fallback.
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home Customization</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage slideshow content for storefront hero: heading, body copy, button, and image.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={resetDefault}>
            <RotateCcw size={16} className="mr-2" />
            Reset Default
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {savedAt && <p className="text-xs text-emerald-600 font-semibold">Saved at {savedAt}</p>}
      {saveError && <p className="text-sm font-semibold text-red-600">{saveError}</p>}
      {loadingRemote && <p className="text-xs text-slate-500 font-semibold">Loading saved configuration...</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-semibold text-slate-800 mb-2">Auto-play duration (seconds)</label>
        <input
          type="number"
          min={2}
          max={15}
          value={config.autoplaySeconds}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              autoplaySeconds: Math.min(15, Math.max(2, Number(e.target.value) || 5)),
            }))
          }
          className="h-11 w-32 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A59B]"
        />
      </div>

      <div className="space-y-6">
        {config.slides.map((slide, index) => (
          <div key={slide.id} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Slide {index + 1}</h2>
              <button
                onClick={() => removeSlide(slide.id)}
                disabled={config.slides.length <= 1}
                className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 disabled:text-slate-300"
              >
                <Trash2 size={16} /> Remove
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Top Tag Text</label>
                <input
                  value={slide.tagText}
                  onChange={(e) => updateSlide(slide.id, 'tagText', e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A59B]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Heading</label>
                <input
                  value={slide.heading}
                  onChange={(e) => updateSlide(slide.id, 'heading', e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A59B]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Body Copy</label>
                <textarea
                  rows={3}
                  value={slide.body}
                  onChange={(e) => updateSlide(slide.id, 'body', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A59B]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Button Label</label>
                <input
                  value={slide.buttonText}
                  onChange={(e) => updateSlide(slide.id, 'buttonText', e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A59B]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Button Link</label>
                <input
                  value={slide.buttonLink}
                  onChange={(e) => updateSlide(slide.id, 'buttonLink', e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A59B]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Image URL</label>
                <input
                  value={slide.imageUrl}
                  onChange={(e) => updateSlide(slide.id, 'imageUrl', e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A59B]"
                />
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                    {uploadingSlideId === slide.id ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    Upload image
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleSlideImageUpload(slide.id, e.target.files?.[0] || null)}
                    />
                  </label>
                  <span className="text-xs text-slate-500">
                    Recommended: 1600x960 px, max 5 MB, formats: JPG/PNG.
                  </span>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Badge Text</label>
                <input
                  value={slide.badgeText}
                  onChange={(e) => updateSlide(slide.id, 'badgeText', e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#00A59B]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addSlide}>
        <Plus size={16} className="mr-2" />
        Add Slide
      </Button>
      {uploadError && <p className="text-sm font-semibold text-red-600">{uploadError}</p>}
    </div>
  );
}
