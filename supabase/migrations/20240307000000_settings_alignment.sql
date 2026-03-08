-- Migration: Align Settings Schema with Application Logic
-- Created: 2024-03-07

-- Add missing outreach and configuration columns to the settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sms_auto_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS radius INTEGER DEFAULT 200;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS active_hour_start INTEGER DEFAULT 7;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS active_hour_end INTEGER DEFAULT 22;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS batch_size INTEGER DEFAULT 5;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pulse_interval INTEGER DEFAULT 15;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS max_items_per_city INTEGER DEFAULT 2;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS unicorn_threshold NUMERIC DEFAULT 4000;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS outreach_sms_goal TEXT DEFAULT 'Ask for bottom dollar';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS ai_persona TEXT DEFAULT 'Professional but casual car buyer';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS crm_webhook_url TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS telnyx_phone_number TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS recon_multiplier NUMERIC DEFAULT 1.0;

-- Refresh the schema cache hint:
-- NOTIFY pgrst, 'reload schema';
