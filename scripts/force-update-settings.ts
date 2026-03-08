import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function update() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    const updates = {
        auto_scan_enabled: true,
        sms_auto_enabled: true,
        makes: ["Toyota", "Lexus", "Honda", "Subaru", "Mazda"],
        year_min: 2019,
        year_max: 2023,
        price_min: 3000,
        price_max: 14000,
        mileage_max: 100000,
        locations: ["losangeles", "orangecounty", "phoenix"],
        zip: "90001",
        pulse_interval: 15,
        active_hour_start: 7,
        active_hour_end: 22,
        batch_size: 5,
        max_items_per_city: 2,
        unicorn_threshold: 4000,
        outreach_sms_goal: 'Ask for bottom dollar',
        ai_persona: 'Professional but casual car buyer',
        recon_multiplier: 1.0
    };

    const { error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', dealerId);

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('Successfully updated demo dealer settings for live test.');
    }
}

update();
