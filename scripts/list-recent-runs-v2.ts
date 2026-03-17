import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function list() {
    const { data, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (data) {
        let out = '--- Recent Scrape Runs ---\n';
        data.forEach(r => {
            out += `[${r.created_at}] Status: ${r.status} | Mode: ${r.mode} | Error: ${r.error} | Cities: ${JSON.stringify(r.cities)}\n`;
        });
        fs.writeFileSync(join(process.cwd(), 'recent_runs_ext.txt'), out);
        console.log('Results written to recent_runs_ext.txt');
    }
}

list();
