-- Migration: Add last_city_index to settings for persistent city rotation
-- Both manual and scheduled scrapes read + advance this index so cities
-- are always visited in closest-first order without repeating.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS last_city_index INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN settings.last_city_index IS
  'Index into the rotating city pool. Incremented after every scrape (manual or scheduled) so each run picks the next batch of cities in closest-first order.';
