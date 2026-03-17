import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function triggerForcedPulse() {
    console.log('[Test Forced Pulse] Triggering pulse with force=true...');
    try {
        const resp = await fetch('http://localhost:3000/api/scraper/pulse?force=true');
        const data = await resp.json();
        console.log('Pulse Response:', data);
    } catch (err) {
        console.error('Failed to trigger pulse:', err);
    }
}

triggerForcedPulse();
