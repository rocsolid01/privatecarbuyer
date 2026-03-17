import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

async function inspect() {
    console.log('Fetching latest runs...');
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&limit=1`);
    const runData = await runRes.json() as any;
    
    if (!runData.data?.items?.[0]) {
        console.error('No runs found.');
        return;
    }

    const run = runData.data.items[0];
    const datasetId = run.defaultDatasetId;
    
    console.log(`Run ID: ${run.id} | Status: ${run.status}`);
    console.log(`Inspecting Dataset: ${datasetId}`);
    
    const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=5`);
    const items = await itemsRes.json() as any;
    
    console.log(`Found ${items.length} items.`);
    if (items.length > 0) {
        console.log('Raw Item [0]:', JSON.stringify(items[0], null, 2));
    } else {
        console.log('Dataset is empty.');
    }
}

inspect();
