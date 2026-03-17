import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const CORRECT_RUN_ID = 'X2Ajh4bAF681vEQ5H';

async function fetchLogs() {
    console.log(`Fetching logs for Run ID: ${CORRECT_RUN_ID}...`);
    
    const logsRes = await fetch(`https://api.apify.com/v2/logs/${CORRECT_RUN_ID}?token=${APIFY_TOKEN}`);
    const logsText = await logsRes.text();
    
    console.log('--- Logs (Last 1000 chars) ---');
    console.log(logsText.slice(-1000));
    
    const fs = await import('fs');
    fs.writeFileSync('correct_apify_logs.txt', logsText);
    console.log('Full logs written to correct_apify_logs.txt');
}

fetchLogs();
