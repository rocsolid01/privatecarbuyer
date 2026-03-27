import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

    if (error) {
        console.log('Profile 000...000 NOT FOUND or error:', error.message);
    } else {
        console.log('Profile 000...000 EXISTS');
    }
}

checkProfile();
