import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const RUN_ID = 'E5y6SEph56OIYUnkM';

async function check() {
    console.log(`Checking Status for Run: ${RUN_ID}`);
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${RUN_ID}?token=${APIFY_TOKEN}`);
    const data = await res.json() as any;
    console.log('Status:', data.data.status);
    console.log('Items Count:', data.data.itemCount);
}

check();
