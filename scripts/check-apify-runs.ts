import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function checkApifyRuns() {
    const token = process.env.APIFY_TOKEN;
    const actorId = 'fatihtahta/craigslist-scraper';

    console.log('Fetching last 5 runs for actor:', actorId);
    try {
        const response = await fetch(`https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/runs?token=${token}&limit=5&desc=1`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch runs:', data.error?.message || response.statusText);
            return;
        }

        const runs = data.data.items;
        for (const run of runs) {
            console.log(`Run ID: ${run.id} | Status: ${run.status} | Started: ${run.startedAt}`);
            if (run.status === 'SUCCEEDED') {
                console.log(`  Dataset ID: ${run.defaultDatasetId}`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkApifyRuns();
