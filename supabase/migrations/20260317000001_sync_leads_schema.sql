-- Migration: Sync Lead Table Schema
-- Adds missing columns and aligns field names for AI Engine V2.0
-- Created at: 2026-03-17

-- 1. Add missing columns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS title_status TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_clean_title BOOLEAN DEFAULT TRUE;

-- 2. Align margin estimate field name
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='ai_margin_est') THEN
        ALTER TABLE public.leads RENAME COLUMN ai_margin_est TO ai_margin;
    END IF;
END $$;

-- 3. Pre-fill year from existing titles for cleaner historical data
UPDATE public.leads 
SET year = (regexp_match(title, '\b(19|20)\d{2}\b'))[1]::integer 
WHERE year IS NULL AND title ~ '\b(19|20)\d{2}\b';
