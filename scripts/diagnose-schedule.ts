import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function runDiagnostics() {
    console.log('--- SYSTEM SETTINGS ---');
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

    if (settingsError) {
        console.error('Error fetching settings:', settingsError.message);
    } else {
        console.log(JSON.stringify(settings, null, 2));
    }

    console.log('\n--- RECENT SCRAPE RUNS (Last 10) ---');
    const { data: runs, error: runsError } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (runsError) {
        console.error('Error fetching runs:', runsError.message);
    } else if (runs) {
        runs.forEach(r => {
            console.log(`[${r.created_at}] Status: ${r.status} | Mode: ${r.mode} | Cities: ${r.cities?.join(', ')} | Leads: ${r.leads_found} | Error: ${r.error_message || 'None'}`);
        });
    }

    console.log('\n--- RECENT LEADS (Last 5) ---');
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('created_at, title, price')
        .order('created_at', { ascending: false })
        .limit(5);

    if (leadsError) {
        console.error('Error fetching leads:', leadsError.message);
    } else if (leads) {
        leads.forEach(l => {
            console.log(`[${l.created_at}] ${l.title} - $${l.price}`);
        });
    }
}

runDiagnostics();
