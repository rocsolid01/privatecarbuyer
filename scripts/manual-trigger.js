
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Since runScraper is ESM, we'll use dynamic import
async function trigger() {
    const { runScraper } = await import('../src/lib/apify.ts'); // tsx handles the .ts
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const dealerId = '00000000-0000-0000-0000-000000000000';
    const { data: settings } = await supabase.from('settings').select('*').eq('id', dealerId).single();

    if (!settings) {
        console.error('Settings not found');
        return;
    }

    console.log('Triggering Detailed Scraper (scrapeDetail=true, maxItems=25)...');
    const result = await runScraper(settings, true, true); // DeepScrape=true, Force=true
    console.log('Result:', result);
}

trigger().catch(console.error);
