import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testPulse() {
    console.log('--- Testing Lambda Pulse Mode ---');
    
    const { data: settings } = await supabase.from('settings').select('*').limit(1).single();
    if (!settings) {
        console.error('No settings found');
        return;
    }

    const LAMBDA_URL = process.env.LAMBDA_SCRAPER_URL;
    if (!LAMBDA_URL) {
        console.error('LAMBDA_SCRAPER_URL not set');
        return;
    }

    const cities = ['losangeles'];
    console.log(`Targeting cities: ${cities.join(', ')}`);

    const payload = {
        mode: 'pulse',
        dealer_id: settings.id,
        cities: cities,
        year_min: 1990,
        year_max: 2026,
        price_min: 500,
        price_max: 1000000,
        makes: [], 
        posted_today: false,
        max_items: 5
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
        const res = await fetch(LAMBDA_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Data Summary:', {
            success: data.success,
            leads_found: data.leads?.length || 0
        });

        if (data.leads && data.leads.length > 0) {
            console.log('\n--- Sample Leads & Mileage ---');
            data.leads.slice(0, 5).forEach((lead: any, i: number) => {
                console.log(`${i+1}. ${lead.title}`);
                console.log(`   Price: $${lead.price} | Mileage: ${lead.mileage || 'None'}`);
                console.log(`   URL: ${lead.url}`);
                if (lead.meta_text) console.log(`   Meta: ${lead.meta_text}`);
            });

            // 7. Verify in database
            console.log('\n--- Database Verification ---');
            const { data: dbLeads, error: dbError } = await supabase
                .from('leads')
                .select('title, mileage, created_at')
                .in('external_id', data.leads.slice(0, 5).map((l: any) => l.external_id));

            if (dbError) {
                console.error('DB Error:', dbError.message);
            } else {
                console.log(`Found ${dbLeads.length} leads in database.`);
                dbLeads.forEach(l => {
                    console.log(`- ${l.title} | DB Mileage: ${l.mileage || 'NULL'}`);
                });
            }
        } else {
            console.warn('No leads found in this pulse.');
        }
    } catch (e: any) {
        console.error('Fetch failed:', e.message);
    }
}

testPulse();
