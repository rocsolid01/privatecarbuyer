const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { join } = require('path');

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data) {
        data.forEach(r => {
            console.log(`[${r.created_at}] ID: ${r.id} | Status: ${r.status} | Mode: ${r.mode} | Cities: ${r.cities} | Error: ${r.error_message}`);
        });
    }
}

check();
