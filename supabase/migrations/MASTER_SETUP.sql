-- MASTER SETUP: Private Car Buyer App
-- Run this in your Supabase SQL Editor to initialize EVERYTHING from scratch.

-- 1. Create Core Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Will be auth.uid()
  email TEXT NOT NULL,
  location TEXT,
  zip TEXT,
  radius INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY,
  location TEXT,
  zip TEXT,
  makes TEXT[] DEFAULT '{}',
  models TEXT[] DEFAULT '{}',
  year_min INTEGER DEFAULT 2018,
  year_max INTEGER DEFAULT 2024,
  mileage_max INTEGER DEFAULT 100000,
  price_min INTEGER DEFAULT 0,
  price_max INTEGER DEFAULT 100000,
  keywords TEXT[] DEFAULT '{}',
  sms_numbers TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{losangeles, orangecounty, phoenix}',
  condition_include TEXT[] DEFAULT '{clean title, low miles}',
  condition_exclude TEXT[] DEFAULT '{rebuilt, flood, salvage}',
  motivation_keywords TEXT[] DEFAULT '{must sell, moving, cash only}',
  post_age_max INTEGER DEFAULT 1,
  margin_min NUMERIC DEFAULT 1500,
  radius INTEGER DEFAULT 200,
  active_hour_start INTEGER DEFAULT 7,
  active_hour_end INTEGER DEFAULT 22,
  batch_size INTEGER DEFAULT 5,
  pulse_interval INTEGER DEFAULT 15,
  max_items_per_city INTEGER DEFAULT 2,
  unicorn_threshold NUMERIC DEFAULT 4000,
  outreach_sms_goal TEXT DEFAULT 'Ask for bottom dollar',
  ai_persona TEXT DEFAULT 'Professional but casual car buyer',
  crm_webhook_url TEXT,
  telnyx_phone_number TEXT DEFAULT '+1234567890',
  recon_multiplier NUMERIC DEFAULT 1.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema Hardening: Ensure columns exist if table was created in an older version
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS auto_scan_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS consecutive_empty_runs INTEGER DEFAULT 0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMPTZ;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS margin_min NUMERIC DEFAULT 1500;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS motivation_keywords TEXT[] DEFAULT '{must sell, moving, cash only}';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS condition_include TEXT[] DEFAULT '{clean title, low miles}';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{losangeles, orangecounty, phoenix}';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pulse_interval INTEGER DEFAULT 15;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS max_items_per_city INTEGER DEFAULT 2;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS unicorn_threshold NUMERIC DEFAULT 4000;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS outreach_sms_goal TEXT DEFAULT 'Ask for bottom dollar';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_persona TEXT DEFAULT 'Professional but casual car buyer';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS crm_webhook_url TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS telnyx_phone_number TEXT DEFAULT '+1234567890';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS recon_multiplier NUMERIC DEFAULT 1.0;

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC,
  mileage INTEGER,
  vin TEXT,
  location TEXT,
  distance NUMERIC,
  url TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  post_time TIMESTAMPTZ,
  ai_margin_est NUMERIC,
  ai_recon_est NUMERIC,
  ai_notes TEXT,
  is_deep_scanned BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'New',
  dealer_id UUID, -- Nullable for MVP/Testing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('dealer', 'seller')),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    external_message_id TEXT,
    error_message TEXT
);

-- 2. Configure Realtime (Allow leads/messages to popup instantly)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Security: Disable RLS for MVP/Ease of Testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 4. Initialize Data
INSERT INTO public.settings (
  id, 
  makes, 
  year_min, 
  year_max, 
  price_max, 
  mileage_max, 
  locations, 
  condition_include, 
  motivation_keywords, 
  margin_min,
  zip,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  '{Honda, Toyota, Ford, BMW, Mercedes}', 
  2018, 
  2024, 
  100000, 
  100000, 
  '{losangeles, orangecounty, phoenix}', 
  '{clean title, low miles}', 
  '{must sell, moving, cash only}', 
  1500,
  '90001',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  makes = EXCLUDED.makes,
  year_min = EXCLUDED.year_min,
  year_max = EXCLUDED.year_max,
  price_max = EXCLUDED.price_max,
  mileage_max = EXCLUDED.mileage_max,
  locations = EXCLUDED.locations,
  condition_include = EXCLUDED.condition_include,
  motivation_keywords = EXCLUDED.motivation_keywords,
  margin_min = EXCLUDED.margin_min,
  zip = EXCLUDED.zip,
  updated_at = NOW();
