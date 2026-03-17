import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkActivity() {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    console.log('--- Checking Activity Since:', fifteenMinsAgo, '---');

    const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).gt('created_at', fifteenMinsAgo);
    console.log('New Leads:', leadsCount);

    const { count: runsCount } = await supabase.from('scrape_runs').select('*', { count: 'exact', head: true }).gt('created_at', fifteenMinsAgo);
    console.log('New Scrape Runs:', runsCount);

    const { data: settings } = await supabase.from('settings').select('updated_at').single();
    console.log('Settings Last Updated:', settings?.updated_at);
}

checkActivity();
