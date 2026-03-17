import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function inspectKeys() {
    const token = process.env.APIFY_TOKEN;
    const actorId = 'fatihtahta/craigslist-scraper';

    try {
        const runsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/runs?token=${token}&limit=1&desc=1&status=SUCCEEDED`);
        const runsData = await runsResponse.json();

        if (!runsResponse.ok || runsData.data.items.length === 0) return;

        const latestRun = runsData.data.items[0];
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${latestRun.defaultDatasetId}/items?token=${token}&limit=1`);
        const items = await datasetResponse.json();

        if (items.length > 0) {
            console.log('ITEM KEYS:', Object.keys(items[0]));
            console.log('SAMPLE VALUES:');
            console.log('Title:', items[0].title);
            console.log('URL:', items[0].url);
            console.log('Price:', items[0].price);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

inspectKeys();
