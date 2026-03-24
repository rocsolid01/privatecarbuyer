import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkTodayRuns() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    console.log(`Checking runs since ${todayStr}...`);
    const { data: runs, error } = await supabase
        .from('scrape_runs')
        .select('*')
        .gte('created_at', todayStr)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error.message);
    } else if (runs) {
        console.log(`Found ${runs.length} runs today.`);
        runs.forEach(r => {
            console.log(`[${r.created_at}] Status: ${r.status} | Mode: ${r.mode} | Error: ${r.error_message || 'None'}`);
        });
    }

    const { data: settings } = await supabase.from('settings').select('active_hour_start, active_hour_end, auto_scan_enabled, last_pulse_at, pulse_interval, daily_budget_usd, budget_spent_today').limit(1).single();
    console.log('\nCritical Settings:', settings);
}

checkTodayRuns();
