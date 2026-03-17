import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { runScraper } from '../src/lib/apify';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function directTrigger() {
    console.log('[Direct Test] Fetching settings...');
    const { data: settings, error } = await supabase.from('settings').select('*').eq('id', '00000000-0000-0000-0000-000000000000').single();
    
    if (error || !settings) {
        console.error('Failed to get settings:', error?.message);
        return;
    }

    console.log('[Direct Test] Triggering runScraper with force=true...');
    const result = await runScraper(settings, false, true);
    console.log('Result:', result);
    
    console.log('Waiting 5 seconds for DB operations...');
    await new Promise(r => setTimeout(r, 5000));
}

directTrigger();
