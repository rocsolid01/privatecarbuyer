-- Migration: Add Daily Budget Guardrails to Scraper Settings
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS daily_budget_usd DECIMAL(10, 2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS budget_spent_today DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_budget_reset_at TIMESTAMPTZ DEFAULT '1970-01-01 00:00:00+00';

-- Comment explaining the fields
COMMENT ON COLUMN settings.daily_budget_usd IS 'Hard daily limit for Apify scraper costs.';
COMMENT ON COLUMN settings.budget_spent_today IS 'Cumulative USD spent since last reset.';
COMMENT ON COLUMN settings.last_budget_reset_at IS 'Timestamp of the last budget reset (midnight tracker).';
