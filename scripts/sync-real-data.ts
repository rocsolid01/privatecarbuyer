import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function syncRealData() {
    console.log('1. Clearing "Test Car" leads...');
    const { error: dError } = await supabase
        .from('leads')
        .delete()
        .eq('title', 'Test Car');

    if (dError) console.error('Delete error:', dError);
    else console.log('Mock leads cleared.');

    const token = process.env.APIFY_TOKEN;
    const actorId = 'fatihtahta/craigslist-scraper';

    console.log('\n2. Fetching latest successful dataset from Apify...');
    const runsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/runs?token=${token}&limit=1&desc=1&status=SUCCEEDED`);
    const runsData = await runsResponse.json();

    if (!runsResponse.ok || runsData.data.items.length === 0) {
        console.error('No successful runs found.');
        return;
    }

    const latestRun = runsData.data.items[0];
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${latestRun.defaultDatasetId}/items?token=${token}`);
    const items = await datasetResponse.json();

    if (items.length === 0) {
        console.log('Dataset is empty.');
        return;
    }

    console.log(`\n3. Simulating webhook call with ${items.length} items...`);

    // Map the capitalized keys from the Apify actor to what our webhook expects
    const mappedItems = items.map((item: any) => ({
        title: item.Title || item['Title'],
        price: item.Price || item['Price'],
        price_text: item['Price Text'],
        url: item['Listing URL'] || item.url,
        posted_at: item['Posted At'] || item.posted_at,
        location: item.Location || item.location,
        address: item['Map Address'],
        description: item.Description,
        image_urls: item['Image URLs'],
        id: item['Post ID']
    })).slice(0, 20);

    // Filter out items that are missing critical fields before sending
    const validItems = mappedItems.filter((item: any) => item.title && item.url);
    console.log(`Filtered to ${validItems.length} valid items.`);

    try {
        const webhookResponse = await fetch('http://localhost:3000/api/webhooks/apify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validItems)
        });

        const result = await webhookResponse.json();
        if (webhookResponse.ok) {
            console.log('SYNC SUCCESS:', result);
        } else {
            console.error('SYNC FAILED (Status ' + webhookResponse.status + '):', JSON.stringify(result, null, 2));
        }
    } catch (fetchErr: any) {
        console.error('Webhook Fetch Error:', fetchErr.message);
    }
}

syncRealData();
