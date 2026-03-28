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
        console.log(`Analyzing Run ID: ${latestRun.id} | Dataset ID: ${latestRun.defaultDatasetId}`);

        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${latestRun.defaultDatasetId}/items?token=${token}&limit=1`);
        const items = await datasetResponse.json();

        if (items.length > 0) {
            const fs = require('fs');
            fs.writeFileSync('tmp/real_payload.json', JSON.stringify(items[0], null, 2));
            console.log('Successfully wrote payload to tmp/real_payload.json');
        } else {
            console.log('Dataset is empty.');
        }
    } catch (err) {
        console.error('Error during inspection:', err);
    }
}

inspectKeys();
