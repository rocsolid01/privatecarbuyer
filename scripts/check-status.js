
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log('--- SCRAPER STATUS CHECK ---');
    
    // 1. Check recent scrape runs
    console.log('\nChecking scrape_runs (last 24h)...');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: runs, error: runsError } = await supabase
        .from('scrape_runs')
        .select('*')
        .gte('created_at', yesterday)
        .order('created_at', { ascending: false });
        
    if (runsError) {
        console.error('Error fetching scrape_runs:', runsError);
    } else if (!runs || runs.length === 0) {
        console.log('No scrape runs found in the last 24 hours.');
    } else {
        console.table(runs.map(r => ({
            id: r.id.split('-')[0] + '...',
            status: r.status,
            mode: r.mode,
            leads: r.leads_found,
            time: new Date(r.created_at).toLocaleString(),
            error: r.error_message ? r.error_message.slice(0, 50) : 'None'
        })));
    }

    // 2. Check recent leads
    console.log('\nChecking new leads (last 24h)...');
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('title, city, price, created_at')
        .gte('created_at', yesterday)
        .order('created_at', { ascending: false });

    if (leadsError) {
        console.error('Error fetching leads:', leadsError);
    } else if (!leads || leads.length === 0) {
        console.log('No new leads found in the last 24 hours.');
    } else {
        console.log(`Found ${leads.length} new leads in the last 24 hours.`);
        console.table(leads.slice(0, 10).map(l => ({
            title: l.title.slice(0, 40),
            city: l.city,
            price: l.price,
            created_at: new Date(l.created_at).toLocaleString()
        })));
    }
}

checkStatus();
