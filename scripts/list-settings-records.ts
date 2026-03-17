import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function list() {
    const { data, error } = await supabase.from('settings').select('id, auto_scan_enabled, active_hour_start, active_hour_end');
    console.log(JSON.stringify(data, null, 2));
}

list();
