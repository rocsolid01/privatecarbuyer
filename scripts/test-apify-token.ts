import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function testApify() {
    const token = process.env.APIFY_TOKEN;
    console.log('Testing token:', token?.substring(0, 10) + '...');

    try {
        const response = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
        const data = await response.json();
        if (response.ok) {
            console.log('Token is VALID. User:', data.data.username);
        } else {
            console.error('Token is INVALID:', data.error?.message || response.statusText);
        }
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testApify();
