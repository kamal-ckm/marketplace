'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { HomeCustomization } from '@/lib/home-customization';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

export function HeroSlideshow({ config }: { config: HomeCustomization }) {
  const slides = config?.slides || [];
  const canNavigate = slides.length > 1;

  const [active, setActive] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [manualPauseUntil, setManualPauseUntil] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  const autoplayMs = useMemo(() => {
    const seconds = Number(config?.autoplaySeconds) || 5;
    return Math.min(15, Math.max(2, seconds)) * 1000;
  }, [config?.autoplaySeconds]);

  function goTo(nextIndex: number, isManual: boolean) {
    const clamped = ((nextIndex % slides.length) + slides.length) % slides.length;
    setActive(clamped);
    if (isManual) {
      // Pause autoplay briefly after manual interaction.
      setManualPauseUntil(Date.now() + 6000);
    }
  }

  useEffect(() => {
    if (!canNavigate) return;
    if (prefersReducedMotion()) return;
    if (isHovering) return;

    const now = Date.now();
    if (manualPauseUntil && now < manualPauseUntil) return;

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, autoplayMs);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [autoplayMs, canNavigate, isHovering, manualPauseUntil, slides.length]);

  useEffect(() => {
    // Reset active index when slides set changes.
    setActive(0);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[Math.min(active, slides.length - 1)];

  const buttonLink = (slide.buttonLink || '/categories/all').trim() || '/categories/all';
  const showTag = Boolean(slide.tagText?.trim());
  const showHeading = Boolean(slide.heading?.trim());
  const showBody = Boolean(slide.body?.trim());
  const showButton = Boolean(slide.buttonText?.trim());
  const showBadge = Boolean(slide.badgeText?.trim());

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-3 md:p-4">
      <div
        className="relative overflow-hidden rounded-2xl bg-[var(--surface-alt)]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Fixed-height hero to match Shopify-like banners (~400px on desktop). */}
        <div className="relative h-[320px] sm:h-[360px] md:h-[400px]">
          <img src={slide.imageUrl} alt={slide.heading || 'Slide'} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="w-full max-w-[660px] px-6 py-6 md:px-10 md:py-8">
              {showTag && (
                <div className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
                  {slide.tagText}
                </div>
              )}

              {showHeading && (
                <h1 className="text-[32px] font-extrabold leading-[1.05] text-white md:text-[48px]" style={{ fontFamily: 'Raleway' }}>
                  {slide.heading}
                </h1>
              )}

              {showBody && <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/85 md:text-[16px]">{slide.body}</p>}

              {showButton && (
                <div className="mt-6">
                  <Link href={buttonLink}>
                    <Button size="lg" className="px-8">
                      {slide.buttonText}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {showBadge && (
            <div className="absolute right-6 top-6 hidden md:block">
              <div className="relative flex h-[132px] w-[132px] items-center justify-center rounded-full bg-[var(--accent-gold)] text-center shadow-xl ring-4 ring-white/85">
                <div className="px-4">
                  <div className="text-[14px] font-bold leading-5 text-black">{slide.badgeText}</div>
                </div>
              </div>
            </div>
          )}

          {canNavigate && (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => goTo(active - 1, true)}
                className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[var(--text-strong)] shadow-md transition hover:bg-white md:flex"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => goTo(active + 1, true)}
                className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[var(--text-strong)] shadow-md transition hover:bg-white md:flex"
              >
                <ChevronRight size={18} />
              </button>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/80 px-3 py-2 backdrop-blur">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => goTo(idx, true)}
                    className={[
                      'h-2.5 w-2.5 rounded-full transition',
                      idx === active ? 'bg-[var(--text-strong)]' : 'bg-black/20 hover:bg-black/35',
                    ].join(' ')}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
