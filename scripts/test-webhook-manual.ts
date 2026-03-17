import * as dotenv from 'dotenv';
import { join } from 'path';
import fs from 'fs';

dotenv.config({ path: join(process.cwd(), '.env') });

async function test() {
    console.log('Reading raw item data...');
    const rawData = fs.readFileSync('raw_item_full.json', 'utf8');
    
    // Extract the JSON part (ignore log lines)
    const jsonStart = rawData.indexOf('Sample Item [0]: {');
    if (jsonStart === -1) {
        console.error('Could not find sample JSON in file.');
        return;
    }
    
    const sampleJsonStr = rawData.slice(jsonStart + 'Sample Item [0]: '.length);
    const item = JSON.parse(sampleJsonStr);

    console.log('Sending sample item to webhook...');
    const response = await fetch('http://localhost:3000/api/webhooks/apify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([item])
    });

    const result = await response.json();
    console.log('Webhook Response:', JSON.stringify(result, null, 2));
}

test();
