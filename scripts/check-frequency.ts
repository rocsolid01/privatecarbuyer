
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScrapeFrequency() {
    console.log('Checking scrape frequency for the last 4 hours...');
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('scrape_runs')
        .select('created_at, status, mode')
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching scrape runs:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No scrape runs found in the last 4 hours.');
        return;
    }

    console.log(`Found ${data.length} runs.`);
    
    // Group by 30-minute windows
    const windows: Record<string, number> = {};
    data.forEach(run => {
        const date = new Date(run.created_at);
        const windowKey = `${date.getHours()}:${date.getMinutes() < 30 ? '00' : '30'}`;
        windows[windowKey] = (windows[windowKey] || 0) + 1;
    });

    console.log('\nRuns per 30-minute window:');
    console.table(Object.entries(windows).map(([time, count]) => ({ time, count })));

    console.log('\nRecent Runs:');
    console.table(data.slice(0, 10).map(run => ({
        created_at: new Date(run.created_at).toLocaleString(),
        status: run.status,
        mode: run.mode
    })));
}

checkScrapeFrequency();
