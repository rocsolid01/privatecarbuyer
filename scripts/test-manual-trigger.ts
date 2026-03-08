import { createClient } from '@supabase/supabase-js';
import { runScraper } from '../src/lib/apify';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testTrigger() {
    console.log('--- Manual Scraper Trigger Test ---');
    const dealerId = '00000000-0000-0000-0000-000000000000';

    const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', dealerId)
        .single();

    if (error || !settings) {
        console.error('Error fetching settings:', error);
        return;
    }

    console.log('Triggering scraper for dealer:', dealerId);
    console.log('Locations:', settings.locations);

    try {
        const result = await runScraper(settings as any, false, true); // force = true
        console.log('Scraper result:', result);
    } catch (err) {
        console.error('Scraper trigger failed:', err);
    }
}

testTrigger();
