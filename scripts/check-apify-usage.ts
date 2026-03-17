import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function checkApifyUsage() {
    const token = process.env.APIFY_TOKEN;
    const actorId = 'fatihtahta/craigslist-scraper';

    console.log('[Usage Check] Fetching latest 10 runs for cost analysis...');
    try {
        const response = await fetch(`https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/runs?token=${token}&limit=10&desc=1`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch runs:', data.error?.message || response.statusText);
            return;
        }

        const runs = data.data.items;
        let totalCost = 0;
        
        console.log('\n--- Recent Run Usage (USD) ---');
        for (const run of runs) {
            const cost = run.usageUsd || 0;
            totalCost += cost;
            console.log(`Run ID: ${run.id} | Status: ${run.status} | Cost: $${cost.toFixed(4)} | Started: ${run.startedAt}`);
        }
        
        console.log('\n====================================');
        console.log(`Total Cost for Last 10 Runs: $${totalCost.toFixed(4)}`);
        console.log('====================================');
        
    } catch (err) {
        console.error('Error:', err);
    }
}

checkApifyUsage();
