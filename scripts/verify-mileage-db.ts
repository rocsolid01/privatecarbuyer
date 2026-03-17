import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMileage() {
    console.log('Checking recent leads for mileage...');
    const { data, error } = await supabase
        .from('leads')
        .select('title, mileage, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No leads found.');
        return;
    }

    console.table(data);
}

checkMileage();
