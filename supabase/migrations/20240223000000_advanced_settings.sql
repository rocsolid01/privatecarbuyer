-- Migration: Add advanced scraper settings to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS year_max INTEGER DEFAULT 2024,
ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{losangeles, orangecounty, phoenix}',
ADD COLUMN IF NOT EXISTS condition_include TEXT[] DEFAULT '{clean title, low miles}',
ADD COLUMN IF NOT EXISTS condition_exclude TEXT[] DEFAULT '{rebuilt, flood, salvage}',
ADD COLUMN IF NOT EXISTS motivation_keywords TEXT[] DEFAULT '{must sell, moving, cash only}',
ADD COLUMN IF NOT EXISTS post_age_max INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS margin_min NUMERIC DEFAULT 1500;

-- Update existing records with defaults if necessary
UPDATE settings SET 
  year_max = COALESCE(year_max, 2024),
  locations = COALESCE(locations, '{losangeles, orangecounty, phoenix}'),
  condition_include = COALESCE(condition_include, '{clean title, low miles}'),
  condition_exclude = COALESCE(condition_exclude, '{rebuilt, flood, salvage}'),
  motivation_keywords = COALESCE(motivation_keywords, '{must sell, moving, cash only}'),
  post_age_max = COALESCE(post_age_max, 1),
  margin_min = COALESCE(margin_min, 1500)
WHERE year_max IS NULL;
