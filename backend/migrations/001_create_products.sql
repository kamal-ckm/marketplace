-- Migration: 001_create_products
-- Creates the initial products table (matches MVP schema exactly)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the status enum
DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  images TEXT[],
  category TEXT NOT NULL,
  status product_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
