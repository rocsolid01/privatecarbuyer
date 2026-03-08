import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', dealerId)
        .single();

    if (error) {
        console.error('Error fetching settings:', JSON.stringify(error, null, 2));
        if ((error as any).details) console.error('Error Details:', (error as any).details);
        if ((error as any).hint) console.error('Error Hint:', (error as any).hint);
        return;
    }

    console.log('--- Sniper Readiness Check ---');
    console.log('Dealer ID:', dealerId);
    console.log('Auto Scan Enabled:', settings.auto_scan_enabled);
    console.log('Locations:', settings.locations);
    console.log('Makes:', settings.makes);
    console.log('Years:', settings.year_min, '-', settings.year_max);
    console.log('Price:', settings.price_min, '-', settings.price_max);
    console.log('Pulse Interval:', settings.pulse_interval);
    console.log('Last Scan At:', settings.last_scan_at);
    console.log('Consecutive Empty:', settings.consecutive_empty_runs);
}

check();
