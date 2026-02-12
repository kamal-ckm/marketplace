-- Migration: 007_backfill_category_vendor
-- Seeds parent/child categories, fallback taxonomy values, and backfills legacy products.

-- Parent categories
INSERT INTO categories (name, slug, parent_id, sort_order, is_active)
VALUES
  ('Fitness & Physical Health', 'fitness-physical-health', NULL, 1, TRUE),
  ('Nutrition & Supplements', 'nutrition-supplements', NULL, 2, TRUE),
  ('Mental & Lifestyle Wellness', 'mental-lifestyle-wellness', NULL, 3, TRUE),
  ('Medical & Condition Care', 'medical-condition-care', NULL, 4, TRUE),
  ('Testing & Diagnostics', 'testing-diagnostics', NULL, 5, TRUE),
  ('Others', 'others', NULL, 999, TRUE)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

-- Child categories
INSERT INTO categories (name, slug, parent_id, sort_order, is_active)
VALUES
  ('Gym & Fitness', 'gym-fitness', (SELECT id FROM categories WHERE slug = 'fitness-physical-health'), 1, TRUE),
  ('Sports & Fitness Equipment', 'sports-fitness-equipment', (SELECT id FROM categories WHERE slug = 'fitness-physical-health'), 2, TRUE),
  ('Diet & Nutrition', 'diet-nutrition', (SELECT id FROM categories WHERE slug = 'nutrition-supplements'), 1, TRUE),
  ('Supplements', 'supplements', (SELECT id FROM categories WHERE slug = 'nutrition-supplements'), 2, TRUE),
  ('Health Foods', 'health-foods', (SELECT id FROM categories WHERE slug = 'nutrition-supplements'), 3, TRUE),
  ('Mental Wellness', 'mental-wellness', (SELECT id FROM categories WHERE slug = 'mental-lifestyle-wellness'), 1, TRUE),
  ('Financial Wellness', 'financial-wellness', (SELECT id FROM categories WHERE slug = 'mental-lifestyle-wellness'), 2, TRUE),
  ('Condition Management', 'condition-management', (SELECT id FROM categories WHERE slug = 'medical-condition-care'), 1, TRUE),
  ('Medical Device', 'medical-device', (SELECT id FROM categories WHERE slug = 'medical-condition-care'), 2, TRUE),
  ('At Home Test Kits', 'at-home-test-kits', (SELECT id FROM categories WHERE slug = 'testing-diagnostics'), 1, TRUE),
  ('Petcare', 'petcare', (SELECT id FROM categories WHERE slug = 'others'), 1, TRUE),
  ('Uncategorized', 'uncategorized', (SELECT id FROM categories WHERE slug = 'others'), 999, TRUE)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

-- Default vendor/brand
INSERT INTO vendors (name, slug, logo_url, is_active)
VALUES ('Unbranded', 'unbranded', NULL, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Backfill products by legacy category text
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL
  AND c.parent_id IS NOT NULL
  AND LOWER(TRIM(p.category)) = LOWER(TRIM(c.name));

-- Set fallback category for non-matching legacy values
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'uncategorized')
WHERE category_id IS NULL;

-- Set fallback vendor for products without vendor
UPDATE products
SET vendor_id = (SELECT id FROM vendors WHERE slug = 'unbranded')
WHERE vendor_id IS NULL;

-- Keep legacy category text aligned with selected child category
UPDATE products p
SET category = c.name
FROM categories c
WHERE p.category_id = c.id;

ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN vendor_id SET NOT NULL;
