import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function diagnose() {
    console.log('--- Scrape Runs Status ---');
    const { data: runs, error: rError } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (rError) console.error('Error:', rError.message);
    else runs.forEach(r => console.log(`- [${r.status}] ${r.mode} | Cities: ${r.cities?.join(', ')} | Error: ${r.error_message || 'None'}`));

    console.log('\n--- Recent Leads Detail ---');
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('title, price, mileage, year, city, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (lError) console.error('Error:', lError.message);
    else leads.forEach(l => console.log(`- ${l.title} | Price: ${l.price} | Mi: ${l.mileage} | Year: ${l.year} | City: ${l.city}`));
}

diagnose();
