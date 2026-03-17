import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSettings() {
    console.log('Fetching system settings...');
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching settings:', error.message);
        return;
    }

    if (!data) {
        console.log('No settings found.');
        return;
    }

    console.log('Settings:', JSON.stringify(data, null, 2));
}

checkSettings();
