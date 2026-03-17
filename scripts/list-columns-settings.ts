import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listColumns() {
    const { data, error } = await supabase.from('settings').select('*').limit(1);
    if (data && data[0]) {
        console.log('Columns in settings table:', Object.keys(data[0]));
    } else {
        console.log('No data found or error:', error);
    }
}

listColumns();
