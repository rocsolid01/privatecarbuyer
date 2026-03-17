import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function listIds() {
    const { data, error } = await supabase.from('settings').select('id');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Settings IDs:', data);
    }
}

listIds();
