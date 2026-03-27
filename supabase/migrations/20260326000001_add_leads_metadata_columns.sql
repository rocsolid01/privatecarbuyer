-- Add metadata and debugging columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_text TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS raw_title TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scraper_version TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS debug_info JSONB;

-- Update comments for clarity
COMMENT ON COLUMN leads.meta_text IS 'Raw metadata string extracted from Craigslist search result';
COMMENT ON COLUMN leads.raw_title IS 'Original title as found on the page before cleaning';
