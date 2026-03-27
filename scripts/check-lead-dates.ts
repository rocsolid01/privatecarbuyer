import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeadDates() {
    const { data, error } = await supabase
        .from('leads')
        .select('title, post_time, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    const output = data?.map(lead => {
        return `Title: ${lead.title}\n  Post Time (Craigslist): ${lead.post_time}\n  Created At (Scrape Time): ${lead.created_at}\n  ---`;
    }).join('\n');

    const fs = require('fs');
    fs.writeFileSync('lead_dates.txt', output || 'No data');
    console.log('Results written to lead_dates.txt');
}

checkLeadDates();
