-- Migration: Add 'Running' status to scrape_runs
-- This enables real-time progress tracking in the dashboard activity log.

ALTER TABLE public.scrape_runs DROP CONSTRAINT IF EXISTS scrape_runs_status_check;
ALTER TABLE public.scrape_runs ADD CONSTRAINT scrape_runs_status_check CHECK (status IN ('Pending', 'Running', 'Success', 'Cooldown', 'Error', 'Partial'));

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
