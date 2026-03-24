
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScrapeRuns() {
    console.log('Fetching recent scrape runs...');
    const { data, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching scrape runs:', error);
        return;
    }

    console.table(data.map(run => ({
        id: run.id,
        status: run.status,
        created_at: run.created_at,
        metadata: JSON.stringify(run.metadata || {}).slice(0, 50)
    })));
}

checkScrapeRuns();
