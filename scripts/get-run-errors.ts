import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getErrors() {
    const { data: runs } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    runs?.forEach(r => {
        console.log(`Run ID: ${r.id}`);
        console.log(`Status: ${r.status} | Found: ${r.leads_found}`);
        if (r.error_message) {
            console.log(`Error Message: ${r.error_message}`);
        } else {
            console.log('No error message recorded.');
        }
        console.log('-------------------');
    });
}

getErrors();
