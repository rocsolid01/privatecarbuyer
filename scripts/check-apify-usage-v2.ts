import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

async function checkUsage() {
    console.log('Fetching latest run usage...');
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&limit=5`);
    const runData = await runRes.json() as any;
    
    if (!runData.data?.items) {
        console.error('No runs found.');
        return;
    }

    console.log('--- Apify Cost Analysis (Last 5 Runs) ---');
    for (const run of runData.data.items) {
        console.log(`Run ID: ${run.id}`);
        console.log(`Status: ${run.status}`);
        console.log(`Total Cost: $${run.usageTotalUsd || 0}`);
        console.log(`Items: ${run.itemCount}`);
        console.log(`Duration: ${run.stats.durationMillis / 1000}s`);
        
        // Detailed usage if available
        if (run.usageUsd) {
            console.log('Breakdown:', JSON.stringify(run.usage, null, 2));
        }
        console.log('-----------------------------------');
    }
}

checkUsage();
