import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function createTable() {
    console.log('Attempting to create scrape_runs table via SQL...');

    // Using a broad RPC if available, or just a direct query if allowed (likely via admin client)
    const sql = `
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
        ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own scrape runs" ON public.scrape_runs FOR SELECT USING (true);
    `;

    // Note: We don't have a direct 'sql' execution tool, but if we're using service role we might be able to 
    // bypass table existence checks for inserts.
    // Let's try to just INSERT and see if it fails due to table missing.
    console.log('Testing insertion into scrape_runs...');
    const { error } = await supabase.from('scrape_runs').insert({
        dealer_id: '00000000-0000-0000-0000-000000000000',
        mode: 'HOT ZONE',
        status: 'Success'
    });

    if (error) {
        console.error('Insertion failed:', error.message);
        if (error.message.includes('not found')) {
            console.log('Table REALLY missing. User needs to run migrations in Supabase dashboard.');
        }
    } else {
        console.log('Insertion SUCCESS. Table exists.');
    }
}

createTable();
