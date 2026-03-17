import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function prepare() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    
    console.log('[Test Prep] Setting budget to $1.00 and pulse to 30 mins...');

    const { error } = await supabase.from('settings').update({
        daily_budget_usd: 1.00,
        pulse_interval: 30,
        budget_spent_today: 0, // Reset for the test
        last_budget_reset_at: new Date().toISOString()
    }).eq('id', dealerId);

    if (error) {
        console.error('Failed to update settings:', error.message);
    } else {
        console.log('SUCCESS: Settings updated for $1.00 safe scrape.');
    }
}

prepare();
