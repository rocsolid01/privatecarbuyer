-- Migration: Create Scrape Runs History Table
-- Created: 2024-03-07

CREATE TABLE IF NOT EXISTS public.scrape_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dealer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    finished_at TIMESTAMPTZ,
    mode TEXT CHECK (mode IN ('HOT ZONE', 'FAR SWEEP', 'SINGLE', 'PRIORITY')) DEFAULT 'HOT ZONE',
    cities TEXT[] DEFAULT '{}',
    leads_found INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('Pending', 'Success', 'Cooldown', 'Error', 'Partial')) DEFAULT 'Pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own scrape runs" ON public.scrape_runs
    FOR SELECT USING (auth.uid() = dealer_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_scrape_runs_dealer_id ON public.scrape_runs(dealer_id);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_started_at ON public.scrape_runs(started_at);
