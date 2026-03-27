import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScrapeHistory() {
    const { data, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching scrape_runs:', error);
        return;
    }

    console.log('--- Scrape Run History ---');
    data?.forEach(run => {
        console.log(`ID: ${run.id}`);
        console.log(`  Started: ${run.started_at}`);
        console.log(`  Status: ${run.status}`);
        console.log(`  Leads Found: ${run.leads_found}`);
        console.log('  ---');
    });
    
    // Also check if any are 'Running' for too long
    const now = new Date();
    data?.filter(r => r.status === 'Running').forEach(r => {
        const start = new Date(r.started_at);
        const diffMin = (now.getTime() - start.getTime()) / (1000 * 60);
        if (diffMin > 10) {
            console.log(`[STALLED] Run ${r.id} has been 'Running' for ${diffMin.toFixed(1)} minutes!`);
        }
    });
}

checkScrapeHistory();
