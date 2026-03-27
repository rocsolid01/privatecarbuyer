import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

    if (error) {
        console.error('Error fetching settings:', error);
        return;
    }

    console.log('--- Settings Verification ---');
    console.log(`Auto Scan Enabled: ${data.auto_scan_enabled}`);
    console.log(`Pulse Interval: ${data.pulse_interval}`);
    console.log(`Max Items: ${data.max_items_per_city}`);
    console.log(`Active Hours: ${data.active_hour_start} - ${data.active_hour_end}`);
    console.log(`Last Pulse At: ${data.last_pulse_at}`);
    console.log(`Last City Index: ${data.last_city_index}`);
    console.log(`Last Attempt At: ${data.last_attempt_at}`);
}

checkSettings();
