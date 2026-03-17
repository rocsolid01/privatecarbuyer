import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkRuns() {
    const { data, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Last 5 Scrape Runs:');
        data.forEach(r => console.log(`- [${r.created_at}] Status: ${r.status} | Mode: ${r.mode} | Error: ${r.error_message}`));
    }
}

checkRuns();
