import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function forceUpdate() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    console.log('[Force Update] Target:', dealerId);
    
    const { data, error } = await supabase
        .from('settings')
        .update({
            active_hour_start: 0,
            active_hour_end: 24,
            pulse_interval: 1,
            auto_scan_enabled: true
        })
        .eq('id', dealerId)
        .select();

    if (error) {
        console.error('Update ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('Update SUCCESS:', JSON.stringify(data, null, 2));
    }
}

forceUpdate();
