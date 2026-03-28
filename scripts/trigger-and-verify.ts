import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function trigger() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    console.log('1. Checking if settings record exists...');
    const { data: existing, error: eError } = await supabase.from('settings').select('*').eq('id', dealerId).single();
    if (eError) {
        console.error('Record not found or error:', eError);
        return;
    }
    console.log('Record found. Updating mileage_max only...');

    const { error: uError } = await supabase.from('settings').update({
        mileage_max: 550000,
    }).eq('id', dealerId);

    if (uError) {
        console.error('Failed to update mileage_max:', uError);
        return;
    }
    console.log('Successfully updated mileage_max!');

    console.log('2. Triggering Lambda scan...');
    const payload = {
        mode: 'pulse',
        dealer_id: dealerId,
        cities: ['losangeles'], // Back to LA for a quick test
        year_min: 1990,
        year_max: 2026,
        price_min: 500,
        price_max: 1000000,
        mileage_max: 550000,
        makes: [],
        posted_today: false,
        max_items: 5
    };

    const LAMBDA_URL = process.env.LAMBDA_SCRAPER_URL!;
    const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    console.log('Response:', data);
    
    if (data.leads && data.leads.length > 0) {
        console.log(`Success! Found ${data.leads.length} leads.`);
        data.leads.forEach((l: any) => console.log(`- ${l.title} | Mileage: ${l.mileage}`));
    } else {
        console.log('Still no leads found.');
    }
}

trigger();
