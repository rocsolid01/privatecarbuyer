import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    const { data, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log('--- Latest Scrape Run ---');
    console.log('ID:', data.id);
    console.log('Status:', data.status);
    console.log('Mode:', data.mode);
    console.log('Cities:', data.cities);
    console.log('Error Field:', data.error);
    console.log('Created At:', data.created_at);
}

check();
