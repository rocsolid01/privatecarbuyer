-- Migration: Sniper Strategy Overhaul
-- Adds all missing parameters for 10-factor dealership control.

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS body_styles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sms_year_max INTEGER DEFAULT 2026,
ADD COLUMN IF NOT EXISTS sms_price_min INTEGER DEFAULT 8000,
ADD COLUMN IF NOT EXISTS sms_price_max INTEGER DEFAULT 25000,
ADD COLUMN IF NOT EXISTS priority_models TEXT[] DEFAULT '{}';

-- Initialize defaults for existing records
UPDATE settings SET 
  body_styles = COALESCE(body_styles, '{"SUV", "Truck", "Sedan"}'),
  sms_year_max = COALESCE(sms_year_max, 2026),
  sms_price_min = COALESCE(sms_price_min, 8000),
  sms_price_max = COALESCE(sms_price_max, 25000)
WHERE body_styles IS NULL;
