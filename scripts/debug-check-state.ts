import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    const dealerId = '00000000-0000-0000-0000-000000000000';

    console.log('Checking for profile...');
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', dealerId).maybeSingle();
    if (pError) console.error('Profile query error:', pError);

    if (!profile) {
        console.log('Profile missing. Inserting demo profile...');
        const { error: iError } = await supabase.from('profiles').insert({
            id: dealerId,
            email: 'demo@example.com',
            location: 'Los Angeles, CA',
            zip: '90001',
            radius: 200
        });
        if (iError) console.error('Profile insert error:', iError);
        else console.log('Demo profile created.');
    } else {
        console.log('Profile exists:', profile.email);
    }

    console.log('\nChecking settings...');
    const { data: settings } = await supabase.from('settings').select('*').eq('id', dealerId).maybeSingle();
    if (settings) {
        console.log('Settings found. Pulse Interval:', settings.pulse_interval);
        console.log('Updated At:', settings.updated_at);
        const lastRun = new Date(settings.updated_at);
        const diffMins = (new Date().getTime() - lastRun.getTime()) / (1000 * 60);
        console.log('Minutes since last update:', diffMins.toFixed(2));
    }

    console.log('\nChecking scrape runs...');
    const { data: runs } = await supabase.from('scrape_runs').select('*').order('created_at', { ascending: false }).limit(5);
    console.log('Recent Runs count:', runs?.length || 0);
    if (runs && runs.length > 0) {
        runs.forEach(r => console.log(`- Run ${r.id}: ${r.status}, Mode: ${r.mode}, Started: ${r.started_at}`));
    }
}

check().catch(console.error);
