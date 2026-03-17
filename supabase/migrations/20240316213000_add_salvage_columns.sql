-- Migration: Add Salvage Title Support
-- Adds title_status to leads and exclude_salvage to settings

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS title_status TEXT DEFAULT 'Clean';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS exclude_salvage BOOLEAN DEFAULT TRUE;

-- Update existing leads to have 'Clean' if null (safety)
UPDATE public.leads SET title_status = 'Clean' WHERE title_status IS NULL;
