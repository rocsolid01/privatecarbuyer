import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function init() {
    console.log('--- Project Data Initialization ---');

    // 1. Get or Create Profile
    const { data: { users }, error: authError } = await (supabase as any).auth.admin.listUsers();
    if (authError) {
        console.error('Error listing users (need service role key):', authError.message);
        return;
    }

    const firstUser = users[0];
    if (!firstUser) {
        console.error('No users found in Supabase Auth. Please sign up first.');
        return;
    }

    console.log(`Found User: ${firstUser.email} (${firstUser.id})`);

    // 2. Ensure Profile Record
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', firstUser.id)
        .maybeSingle();

    if (!profile) {
        console.log('Creating profile record...');
        await supabase.from('profiles').insert({
            id: firstUser.id,
            email: firstUser.email,
            location: 'Los Angeles, CA',
            zip: '90001'
        });
    }

    // 3. Ensure Settings Record
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', firstUser.id)
        .maybeSingle();

    if (!settings) {
        console.log('Creating default settings record...');
        await supabase.from('settings').insert({
            id: firstUser.id,
            makes: ['Honda', 'Toyota'],
            year_min: 2015,
            price_max: 25000,
            auto_scan_enabled: true,
            pulse_interval: 15
        });
    }

    console.log('Initialization complete. System is ready for dynamic runs.');
}

init();
