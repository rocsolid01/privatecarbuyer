-- Migration: Add cities and mode to scrape_runs
-- Enables better tracking of cloud engine activity in the UI
-- Created at: 2026-03-17

ALTER TABLE public.scrape_runs ADD COLUMN IF NOT EXISTS cities TEXT[];
ALTER TABLE public.scrape_runs ADD COLUMN IF NOT EXISTS mode TEXT;
