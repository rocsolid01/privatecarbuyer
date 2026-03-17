import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

async function fetchLogs() {
    console.log('Fetching latest runs...');
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&limit=1`);
    const runData = await runRes.json() as any;
    
    if (!runData.data?.items?.[0]) {
        console.error('No runs found.');
        return;
    }

    const run = runData.data.items[0];
    console.log(`Fetching logs for Run ID: ${run.id}...`);
    
    const logsRes = await fetch(`https://api.apify.com/v2/logs/${run.id}?token=${APIFY_TOKEN}`);
    const logsText = await logsRes.text();
    
    console.log('--- Logs (Last 1000 chars) ---');
    console.log(logsText.slice(-1000));
    
    // Write full logs to a file for easier inspection
    const fs = await import('fs');
    fs.writeFileSync('apify_run_logs.txt', logsText);
    console.log('Full logs written to apify_run_logs.txt');
}

fetchLogs();
