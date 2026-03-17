import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function updateSettings() {
    console.log('Updating system settings...');
    const { data: currentSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .maybeSingle();

    if (!currentSettings) {
        console.log('No settings found to update.');
        return;
    }

    const { error } = await supabase
        .from('settings')
        .update({ post_age_max: 24 })
        .eq('id', currentSettings.id);

    if (error) {
        console.error('Error updating settings:', error.message);
        return;
    }

    console.log('Successfully updated post_age_max to 24 hours.');
}

updateSettings();
