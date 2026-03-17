import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

async function checkUsage() {
    console.log('Fetching latest run info...');
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&limit=3`);
    const runData = await runRes.json() as any;
    
    if (!runData.data?.items) {
        console.error('No runs found.');
        return;
    }

    for (const run of runData.data.items) {
        console.log(`\n--- Run ID: ${run.id} ---`);
        console.log(`Status: ${run.status}`);
        console.log(`Total Cost: $${run.usageTotalUsd}`);
        console.log(`Items: ${run.itemCount}`);
        
        // Fetch input
        const inputRes = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}/input?token=${APIFY_TOKEN}`);
        const input = await inputRes.json();
        console.log('Input (Partial):', JSON.stringify({
            startUrls: input.startUrls?.length,
            maxItems: input.maxItems,
            maxPagesPerSearch: input.maxPagesPerSearch,
            downloadImages: input.downloadImages,
            proxyConfiguration: input.proxyConfiguration
        }, null, 2));

        // Usage breakdown
        if (run.usage) {
            console.log('Usage Breakdown:');
            Object.entries(run.usage).forEach(([key, val]: [string, any]) => {
                if (val > 0) console.log(` - ${key}: $${val}`);
            });
        }
    }
}

checkUsage();
