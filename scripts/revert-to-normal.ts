import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function revert() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    console.log('[Stop Test] Reverting to Normal Operations (7AM-11PM, 15min Pulses)...');
    
    const { error } = await supabase
        .from('settings')
        .update({
            active_hour_start: 7,
            active_hour_end: 23,
            pulse_interval: 15, // Standard production interval
            auto_scan_enabled: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', dealerId);

    if (error) {
        console.error('Revert Failed:', error);
    } else {
        console.log('System Restored to Normal State.');
    }
}

revert();
