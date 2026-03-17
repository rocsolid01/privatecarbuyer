import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const RUN_ID = 'X2Ajh4bAF681vEQ5H';
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/apify';

async function reingest() {
    console.log(`Fetching items for Run: ${RUN_ID}...`);
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${RUN_ID}?token=${APIFY_TOKEN}`);
    const runData = await runRes.json() as any;
    const datasetId = runData.data.defaultDatasetId;
    
    console.log(`Dataset ID: ${datasetId}. Fetching all items...`);
    const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
    const items = await itemsRes.json() as any[];
    
    console.log(`Found ${items.length} items. Sending to webhook in batches of 100...`);
    
    for (let i = 0; i < items.length; i += 100) {
        const batch = items.slice(i, i + 100);
        console.log(`Sending batch ${i / 100 + 1}...`);
        const resp = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batch)
        });
        const result = await resp.json();
        console.log(`Batch ${i / 50 + 1} Result:`, JSON.stringify(result));
    }
    
    console.log('Re-ingestion complete!');
}

reingest();
