import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'fatihtahta/craigslist-scraper';

async function capturePayload() {
    if (!APIFY_TOKEN) {
        console.error('APIFY_TOKEN not found in .env');
        return;
    }

    console.log(`[Diagnostic] Fetching most recent SUCCEEDED run for ${ACTOR_ID}...`);
    
    try {
        const actorIdClean = ACTOR_ID.replace('/', '~');
        const runsUrl = `https://api.apify.com/v2/acts/${actorIdClean}/runs?token=${APIFY_TOKEN}&limit=5&desc=1&status=SUCCEEDED`;
        
        const runsResp = await fetch(runsUrl);
        const runsData = await runsResp.json();

        if (!runsResp.ok || !runsData.data || runsData.data.items.length === 0) {
            console.error('No successful runs found. Checking ALL runs...');
            const allRunsResp = await fetch(`https://api.apify.com/v2/acts/${actorIdClean}/runs?token=${APIFY_TOKEN}&limit=5&desc=1`);
            const allRunsData = await allRunsResp.json();
            if (allRunsData.data.items.length === 0) {
                console.error('No runs found at all for this actor.');
                return;
            }
            // Use the latest one regardless of status
            var latestRun = allRunsData.data.items[0];
        } else {
            var latestRun = runsData.data.items[0];
        }

        console.log(`[Diagnostic] Using Run ID: ${latestRun.id} (Status: ${latestRun.status})`);
        console.log(`[Diagnostic] Dataset ID: ${latestRun.defaultDatasetId}`);

        const itemsUrl = `https://api.apify.com/v2/datasets/${latestRun.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=1`;
        const itemsResp = await fetch(itemsUrl);
        const items = await itemsResp.json();

        if (items.length > 0) {
            console.log('--- RAW PAYLOAD START ---');
            console.log(JSON.stringify(items[0], null, 2));
            console.log('--- RAW PAYLOAD END ---');
            
            console.log('--- KEY INSPECTION ---');
            console.log('Keys available:', Object.keys(items[0]));
            if (items[0].attributes) {
                console.log('Attributes Type:', typeof items[0].attributes);
                console.log('Attributes Data:', JSON.stringify(items[0].attributes, null, 2));
            }
        } else {
            console.error('Dataset is empty.');
        }

    } catch (err) {
        console.error('[Diagnostic] Error:', err);
    }
}

capturePayload();
