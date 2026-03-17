import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verify() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    
    console.log('[Verification] Testing Budget Guardrail...');

    // 1. Set a very low budget
    console.log('1. Setting daily budget to $0.01...');
    const { error: uError } = await supabase.from('settings').update({
        daily_budget_usd: 0.01,
        budget_spent_today: 0.10, // Already "exceeded"
        last_budget_reset_at: new Date().toISOString()
    }).eq('id', dealerId);

    if (uError) {
        console.error('Failed to update settings (Columns likely missing):', uError.message);
        console.log('\n>>> PLEASE RUN THE SQL MIGRATION IN THE SUPABASE SQL EDITOR FIRST <<<');
        return;
    }

    // 2. Trigger pulse
    console.log('2. Triggering pulse (should be blocked)...');
    const resp = await fetch('http://localhost:3000/api/scraper/pulse');
    const data = await resp.json();
    console.log('Pulse Response:', data);

    if (data.reason === 'budget-exceeded') {
        console.log('SUCCESS: Pulse was correctly blocked by budget guardrail.');
    } else {
        console.error('FAILURE: Pulse was not blocked as expected.');
    }

    // 3. Reset for normal testing
    console.log('3. Resetting budget to $5.00 for normal operation...');
    await supabase.from('settings').update({
        daily_budget_usd: 5.00,
        budget_spent_today: 0.00
    }).eq('id', dealerId);
}

verify();
