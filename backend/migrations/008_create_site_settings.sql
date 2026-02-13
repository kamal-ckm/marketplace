-- Migration: 008_create_site_settings
-- Adds a simple key/value settings table for global storefront configuration.
-- Used initially for Home Customization (homepage slideshow).

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at_site_settings ON site_settings;
CREATE TRIGGER set_updated_at_site_settings
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default home customization (idempotent)
INSERT INTO site_settings (key, value)
VALUES (
  'home_customization',
  '{
    "autoplaySeconds": 5,
    "slides": [
      {
        "id": "slide-1",
        "tagText": "Featured campaign",
        "heading": "Electronics Sale Live Now - 24 Hours to Save",
        "body": "Your next essential is waiting - up to 60% off during our flash sale.",
        "buttonText": "Shop Now",
        "buttonLink": "/categories/all",
        "imageUrl": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600",
        "badgeText": "Save Up to 60%"
      },
      {
        "id": "slide-2",
        "tagText": "Featured campaign",
        "heading": "Build Your Wellness Stack",
        "body": "Nutrition, diagnostics, and condition-care essentials in one place.",
        "buttonText": "Explore Products",
        "buttonLink": "/categories/all",
        "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1600",
        "badgeText": "Save Up to 40%"
      },
      {
        "id": "slide-3",
        "tagText": "Featured campaign",
        "heading": "Employer-Sponsored Benefits, Simplified",
        "body": "Apply wallet and rewards confidently with beneficiary-first checkout.",
        "buttonText": "View Cart",
        "buttonLink": "/cart",
        "imageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1600",
        "badgeText": "Save Up to 30%"
      }
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

