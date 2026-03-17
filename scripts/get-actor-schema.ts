import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

async function getActorSchema() {
    const token = process.env.APIFY_TOKEN;
    const actorId = 'fatihtahta/craigslist-scraper';

    console.log('[Schema Check] Fetching input schema for:', actorId);
    try {
        const response = await fetch(`https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/versions/last?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to fetch schema:', data.error?.message || response.statusText);
            return;
        }

        console.log('Actor Input Schema:', JSON.stringify(data.data.inputSchema, null, 2));
        
    } catch (err) {
        console.error('Error:', err);
    }
}

getActorSchema();
