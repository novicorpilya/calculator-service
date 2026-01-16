-- ============================================================
-- Migration: Ensure Suppliers & Inventory Schema
-- Description: Creates or repairs suppliers and inventory_items tables.
-- ============================================================

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    rating NUMERIC DEFAULT 5.0,
    contacts JSONB DEFAULT '{}'::jsonb,
    integration_type TEXT DEFAULT 'internal',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already existed without them
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='integration_type') THEN
        ALTER TABLE public.suppliers ADD COLUMN integration_type TEXT DEFAULT 'internal';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='contacts') THEN
        ALTER TABLE public.suppliers ADD COLUMN contacts JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    color TEXT,
    price NUMERIC DEFAULT 0,
    stock INT DEFAULT 0,
    norm_area NUMERIC DEFAULT 0,
    norm_personnel NUMERIC DEFAULT 0,
    norm_intensity NUMERIC DEFAULT 1.0,
    replacement_cycle_days INT DEFAULT 30,
    supplier_id UUID REFERENCES public.suppliers(id),
    category TEXT,
    tier INT,
    durability INT,
    series TEXT,
    compliance_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns for inventory_items if needed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='category') THEN
        ALTER TABLE public.inventory_items ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='tier') THEN
        ALTER TABLE public.inventory_items ADD COLUMN tier INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='durability') THEN
        ALTER TABLE public.inventory_items ADD COLUMN durability INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='series') THEN
        ALTER TABLE public.inventory_items ADD COLUMN series TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='compliance_level') THEN
        ALTER TABLE public.inventory_items ADD COLUMN compliance_level TEXT;
    END IF;
END $$;
