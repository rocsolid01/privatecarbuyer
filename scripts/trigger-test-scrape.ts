import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function triggerTestPulse() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    
    console.log('[Test Scrape] Setting up for $0.25 test...');

    // 1. Temporarily set locations to just one city to minimize cost
    const { error: uError } = await supabase.from('settings').update({
        locations: ['losangeles'],
        max_items_per_city: 2,
        daily_budget_usd: 5.00, // Ensure we have enough budget for the test
    }).eq('id', dealerId);

    if (uError) {
        console.error('Failed to update settings:', uError.message);
        return;
    }

    console.log('2. Triggering pulse for Los Angeles...');
    try {
        const resp = await fetch('http://localhost:3000/api/scraper/pulse');
        const data = await resp.json();
        console.log('Pulse Response:', data);
    } catch (err) {
        console.error('Failed to trigger pulse:', err);
    }
}

triggerTestPulse();
