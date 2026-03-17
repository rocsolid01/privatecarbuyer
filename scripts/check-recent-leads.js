const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { join } = require('path');

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data) {
        console.log('Recent Leads:');
        data.forEach(l => {
            console.log(`[${l.created_at}] Title: ${l.title} | Price: ${l.price} | URL: ${l.url}`);
        });
    }
}

checkLeads();
