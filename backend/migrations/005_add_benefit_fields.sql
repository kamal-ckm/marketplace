-- Migration: 005_add_benefit_fields
-- Adds wallet eligibility to products and payment splits to orders

-- 1. Update Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS wallet_eligible BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rewards_eligible BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS flex_collection_id TEXT;

-- 2. Update Orders for Payment Split
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rewards_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS beneficiary_name TEXT DEFAULT 'Self';

-- 3. Update Users with Employer Context (Mock)
ALTER TABLE users ADD COLUMN IF NOT EXISTS employer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employer_name TEXT;
