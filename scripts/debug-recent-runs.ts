import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
    console.log('--- Recent Scrape Runs ---');
    const { data: runs } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    runs?.forEach(r => {
        console.log(`ID: ${r.id} | Status: ${r.status} | Cities: ${r.cities} | Found: ${r.leads_found}`);
        if (r.error_message) console.log(`   Error: ${r.error_message}`);
    });

    console.log('\n--- Recent Leads ---');
    const { data: leads } = await supabase
        .from('leads')
        .select('title, mileage, created_at, city')
        .order('created_at', { ascending: false })
        .limit(5);

    leads?.forEach(l => {
        console.log(`- ${l.title} (${l.city}) | Mileage: ${l.mileage} | Scraped: ${l.created_at}`);
    });
}

debug();
