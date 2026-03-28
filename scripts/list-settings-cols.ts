import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listCols() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1);
    
    if (data && data[0]) {
        console.log('Total Columns:', Object.keys(data[0]).length);
        Object.keys(data[0]).sort().forEach(col => console.log(`- ${col}`));
    } else {
        console.error('No data found or error:', error);
    }
}

listCols();
