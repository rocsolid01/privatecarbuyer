import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const RUN_ID = 'X2Ajh4bAF681vEQ5H'; // The Craigslist run that cost $1.68

async function check() {
    console.log(`Analyzing Run: ${RUN_ID}`);
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${RUN_ID}?token=${APIFY_TOKEN}`);
    const data = await res.json() as any;
    
    console.log('Status:', data.data.status);
    console.log('Total Cost:', data.data.usageTotalUsd);
    console.log('Usage Breakdown:', JSON.stringify(data.data.usage, null, 2));
    
    const inputRes = await fetch(`https://api.apify.com/v2/actor-runs/${RUN_ID}/input?token=${APIFY_TOKEN}`);
    const input = await inputRes.json();
    console.log('Actual Actor Input:', JSON.stringify(input, null, 2));
}

check();
