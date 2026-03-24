import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSpecificWindow() {
    const start = '2026-03-17T00:00:00Z';
    const end = '2026-03-17T23:59:59Z';

    console.log(`Checking runs between ${start} and ${end}...`);
    const { data: runs, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error:', error.message);
    } else if (runs) {
        console.log(`Found ${runs.length} runs today.`);
        runs.forEach(r => {
            console.log(`[${r.created_at}] Status: ${r.status} | Mode: ${r.mode} | Error: ${r.error_message || 'None'}`);
        });
    }
}

checkSpecificWindow();
