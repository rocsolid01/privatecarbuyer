-- Migration: Autonomous Scraper Persistence
-- Adding state tracking for 24/7 autonomous operation

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS auto_scan_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consecutive_empty_runs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMPTZ;

-- Ensure these columns have defaults in existing records
UPDATE settings SET 
  auto_scan_enabled = COALESCE(auto_scan_enabled, FALSE),
  consecutive_empty_runs = COALESCE(consecutive_empty_runs, 0)
WHERE auto_scan_enabled IS NULL OR consecutive_empty_runs IS NULL;
