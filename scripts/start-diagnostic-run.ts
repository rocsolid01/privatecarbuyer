import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function activate() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    console.log('[Diagnostic] Enabling 24/7 mode and 1-minute pulses...');
    
    const { error } = await supabase
        .from('settings')
        .update({
            active_hour_start: 0,
            active_hour_end: 24,
            pulse_interval: 1, // High frequency for diagnostic
            auto_scan_enabled: true,
            last_pulse_at: new Date(0).toISOString(), // Force immediate run
            updated_at: new Date().toISOString()
        })
        .eq('id', dealerId);

    if (error) {
        console.error('Update Failed:', error);
    } else {
        console.log('Settings Locked for Diagnostic Run.');
    }
}

activate();
