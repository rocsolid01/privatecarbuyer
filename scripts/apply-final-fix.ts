import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fix() {
    const dealerId = '00000000-0000-0000-0000-000000000000';

    console.log('1. Ensuring Profile exists...');
    const { error: pError } = await supabase.from('profiles').upsert({
        id: dealerId,
        email: 'demo@privatecarbuyer.com',
        location: 'Los Angeles, CA',
        zip: '90001'
    });
    if (pError) console.error('Profile error:', pError);
    else console.log('Profile OK.');

    console.log('\n2. Adding last_pulse_at column if missing (via SQL)...');
    // Using simple RPC or just attempting an update to see if it exists
    const { error: sError } = await supabase.from('settings').update({
        last_pulse_at: new Date(0).toISOString()
    }).eq('id', dealerId);

    if (sError) {
        console.log('Column might be missing. Please run MASTER_SETUP.sql in Supabase SQL editor.');
        console.error('Update error:', sError.message);
    } else {
        console.log('Settings column last_pulse_at confirmed/updated.');
    }

    console.log('\n3. Resetting cooldown...');
    await supabase.from('settings').update({
        last_pulse_at: new Date(0).toISOString(),
        updated_at: new Date().toISOString()
    }).eq('id', dealerId);
    console.log('Cooldown reset to 1970.');
}

fix();
