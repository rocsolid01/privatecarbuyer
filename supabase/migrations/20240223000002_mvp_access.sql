-- Allow public access to core tables for the MVP/Testing phase
-- This resolves the "Dealer settings not found" issue by allowing settings to be saved even if not logged in.

-- 1. Profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Settings
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
-- Remove the foreign key constraint to profiles for the placeholder ID to work
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_id_fkey;

-- 3. Leads
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
-- Make dealer_id nullable for now so we can insert leads without a profile
ALTER TABLE public.leads ALTER COLUMN dealer_id DROP NOT NULL;
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_dealer_id_fkey;

-- Ensure we have a default settings record
INSERT INTO public.settings (id, makes, year_min, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '{Honda, Toyota, Ford}', 2018, NOW())
ON CONFLICT (id) DO NOTHING;
