import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function testDeep() {
    const LAMBDA_URL = process.env.LAMBDA_SCRAPER_URL!;
    const deepUrl = 'https://losangeles.craigslist.org/lac/cto/d/north-hollywood-2019-nissan-altima-sr/7923924654.html';
    
    console.log(`--- Testing Deep Scrape for URL: ${deepUrl} ---`);
    
    const payload = {
        mode: 'deep',
        deep_url: deepUrl
    };

    try {
        const res = await fetch(LAMBDA_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data) {
            console.log('\nExtracted Data:');
            console.log(`- Mileage: ${data.data.mileage}`);
            console.log(`- VIN: ${data.data.vin}`);
            if (data.data.attributes) {
                console.log('- Attributes:', data.data.attributes);
            }
        } else {
            console.error('Deep scrape failed or returned no data.');
        }
    } catch (e: any) {
        console.error('Fetch failed:', e.message);
    }
}

testDeep();
