import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const CORRECT_RUN_ID = 'X2Ajh4bAF681vEQ5H';

async function inspect() {
    console.log(`Fetching details for Run: ${CORRECT_RUN_ID}`);
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${CORRECT_RUN_ID}?token=${APIFY_TOKEN}`);
    const runData = await runRes.json() as any;
    const datasetId = runData.data.defaultDatasetId;
    
    console.log(`Dataset ID: ${datasetId}`);
    const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=5`);
    const items = await itemsRes.json() as any;
    
    console.log(`Found ${items.length} sample items.`);
    if (items.length > 0) {
        console.log('Raw Item Structure:', Object.keys(items[0]));
        console.log('Sample Item [0]:', JSON.stringify(items[0], null, 2));
    }
}

inspect();
