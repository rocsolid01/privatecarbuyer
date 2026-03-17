import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSchema() {
    console.log('Checking for tables...');

    const { data: leads, error: lError } = await supabase.from('leads').select('*').limit(1);
    console.log('Leads table:', lError ? 'ERROR: ' + lError.message : 'OK');

    const { data: runs, error: rError } = await supabase.from('scrape_runs').select('*').limit(1);
    console.log('Scrape Runs table:', rError ? 'ERROR: ' + rError.message : 'OK');

    const { data: history, error: hError } = await supabase.from('scrape_history').select('*').limit(1);
    console.log('Scrape History table:', hError ? 'ERROR: ' + hError.message : 'OK');
}

checkSchema();
