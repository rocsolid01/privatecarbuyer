-- Migration: Add city column to leads table
-- Created at: 2026-03-17

ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;

-- Update existing leads location based on prefix if known, otherwise keep as is
-- (Optional cleanup if needed)
