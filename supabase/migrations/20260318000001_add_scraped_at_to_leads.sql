-- Add scraped_at column to leads table
-- The lambda scraper writes this timestamp when it scrapes each listing

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS scraped_at timestamptz DEFAULT now();

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
