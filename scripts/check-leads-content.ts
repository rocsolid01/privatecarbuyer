import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkLeads() {
    console.log('Fetching most recent leads from DB...');
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching leads:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No leads found in DB.');
        return;
    }

    data.forEach((lead, i) => {
        console.log(`[${i + 1}] Title: ${lead.title} | Price: ${lead.price} | URL: ${lead.url}`);
    });
}

checkLeads();
