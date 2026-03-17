import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function trigger() {
    console.log('[Test] Triggering Consolidated Pulse...');
    const response = await fetch('http://localhost:3000/api/scraper/pulse');
    const data = await response.json();
    console.log('Response:', data);
}

trigger();
