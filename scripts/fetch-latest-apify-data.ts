import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function getLatestData() {
    const token = process.env.APIFY_TOKEN;
    const actorId = 'fatihtahta/craigslist-scraper';

    console.log('Fetching latest SUCCESSFUL run for actor:', actorId);
    try {
        const runsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/runs?token=${token}&limit=1&desc=1&status=SUCCEEDED`);
        const runsData = await runsResponse.json();

        if (!runsResponse.ok || runsData.data.items.length === 0) {
            console.error('No successful runs found.');
            return;
        }

        const latestRun = runsData.data.items[0];
        console.log(`Latest Run ID: ${latestRun.id} | Dataset ID: ${latestRun.defaultDatasetId}`);

        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${latestRun.defaultDatasetId}/items?token=${token}&limit=5`);
        const items = await datasetResponse.json();

        if (items.length === 0) {
            console.log('Dataset is empty.');
            return;
        }

        console.log(`Found ${items.length} items. Samples:`);
        items.forEach((item: any, i: number) => {
            console.log(`[${i + 1}] Title: ${item.title} | Price: ${item.price} | URL: ${item.url}`);
        });

        return items;
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

getLatestData();
