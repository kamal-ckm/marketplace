-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the status enum
CREATE TYPE product_status AS ENUM ('DRAFT', 'PUBLISHED');

-- Create the products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Use built-in UUID function
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  images TEXT[], -- Using Postgres text array
  category TEXT NOT NULL,
  status product_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
