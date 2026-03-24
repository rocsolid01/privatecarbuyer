import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getFullError() {
    const { data: run, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .eq('status', 'Error')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else if (run) {
        console.log('Run ID:', run.id);
        console.log('Created At:', run.created_at);
        console.log('Error Message:', run.error_message);
    }
}

getFullError();
