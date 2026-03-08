-- Add is_deep_scanned column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_deep_scanned BOOLEAN DEFAULT FALSE;

-- Update MASTER_SETUP for future-proofing
-- (Note: In a real environment we'd just run the migration, but since I'm maintaining a MASTER_SETUP.sql for the user, I'll update it there too if needed)
