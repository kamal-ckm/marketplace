/**
 * Public Site Settings: Home Customization (Homepage Slideshow)
 *
 * GET /api/home-customization
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

const DEFAULT_HOME_CUSTOMIZATION = {
  autoplaySeconds: 5,
  slides: [
    {
      id: 'slide-1',
      tagText: 'Featured campaign',
      heading: 'Electronics Sale Live Now - 24 Hours to Save',
      body: 'Your next essential is waiting - up to 60% off during our flash sale.',
      buttonText: 'Shop Now',
      buttonLink: '/categories/all',
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600',
      badgeText: 'Save Up to 60%',
    },
    {
      id: 'slide-2',
      tagText: 'Featured campaign',
      heading: 'Build Your Wellness Stack',
      body: 'Nutrition, diagnostics, and condition-care essentials in one place.',
      buttonText: 'Explore Products',
      buttonLink: '/categories/all',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1600',
      badgeText: 'Save Up to 40%',
    },
    {
      id: 'slide-3',
      tagText: 'Featured campaign',
      heading: 'Employer-Sponsored Benefits, Simplified',
      body: 'Apply wallet and rewards confidently with beneficiary-first checkout.',
      buttonText: 'View Cart',
      buttonLink: '/cart',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1600',
      badgeText: 'Save Up to 30%',
    },
  ],
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function sanitizeHomeCustomization(raw) {
  const autoplaySeconds = clamp(Number(raw?.autoplaySeconds) || DEFAULT_HOME_CUSTOMIZATION.autoplaySeconds, 2, 15);

  const slidesRaw = Array.isArray(raw?.slides) ? raw.slides : [];
  const slides = slidesRaw
    .map((slide, idx) => ({
      id: String(slide?.id || `slide-${idx + 1}`),
      tagText: String(slide?.tagText ?? ''),
      heading: String(slide?.heading ?? ''),
      body: String(slide?.body ?? ''),
      buttonText: String(slide?.buttonText ?? ''),
      buttonLink: String(slide?.buttonLink ?? ''),
      imageUrl: String(slide?.imageUrl ?? ''),
      badgeText: String(slide?.badgeText ?? ''),
    }))
    .filter((slide) => Boolean(slide.heading.trim()) && Boolean(slide.imageUrl.trim()));

  return {
    autoplaySeconds,
    slides: slides.length > 0 ? slides : DEFAULT_HOME_CUSTOMIZATION.slides,
  };
}

router.get('/home-customization', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT value FROM site_settings WHERE key = $1', ['home_customization']);
    if (!rows[0]?.value) {
      return res.json(DEFAULT_HOME_CUSTOMIZATION);
    }
    return res.json(sanitizeHomeCustomization(rows[0].value));
  } catch (err) {
    // If migrations haven't run yet, fallback to a safe default instead of breaking the storefront.
    console.error('Home customization fetch error:', err);
    return res.json(DEFAULT_HOME_CUSTOMIZATION);
  }
});

module.exports = { router, sanitizeHomeCustomization, DEFAULT_HOME_CUSTOMIZATION };

