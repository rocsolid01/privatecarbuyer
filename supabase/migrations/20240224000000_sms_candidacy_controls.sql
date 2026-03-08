-- Migration: Advanced SMS Outreach Controls
-- Adds granular controls for dealerships to define "ideal" candidates for automated SMS.

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS sms_auto_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sms_min_margin NUMERIC DEFAULT 1500,
ADD COLUMN IF NOT EXISTS sms_max_mileage INTEGER DEFAULT 120000,
ADD COLUMN IF NOT EXISTS sms_year_min INTEGER DEFAULT 2015,
ADD COLUMN IF NOT EXISTS sms_require_vin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_exclude_keywords TEXT[] DEFAULT '{"rebuilt", "salvage", "parts only", "mechanic special"}';

-- Ensure these columns have defaults in existing records (like the demo dealer)
UPDATE settings SET 
  sms_auto_enabled = COALESCE(sms_auto_enabled, TRUE),
  sms_min_margin = COALESCE(sms_min_margin, 1500),
  sms_max_mileage = COALESCE(sms_max_mileage, 120000),
  sms_year_min = COALESCE(sms_year_min, 2015),
  sms_require_vin = COALESCE(sms_require_vin, FALSE),
  sms_exclude_keywords = COALESCE(sms_exclude_keywords, '{"rebuilt", "salvage", "parts only", "mechanic special"}')
WHERE sms_auto_enabled IS NULL;
