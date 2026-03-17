-- Migration: Add last_seen_at to leads table
-- This enables the "Active vs Sold" tracking logic.
-- When the Lambda scraper upserts a listing it already found, it updates
-- last_seen_at. Dashboard queries can filter WHERE last_seen_at > now() - interval '7 days'
-- to show only active listings.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- Backfill existing rows
UPDATE leads SET last_seen_at = created_at WHERE last_seen_at IS NULL;

-- Index for efficient "active listings" queries
CREATE INDEX IF NOT EXISTS idx_leads_last_seen_at ON leads (last_seen_at DESC);
