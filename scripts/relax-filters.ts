import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function relaxFilters() {
    const dealerId = '00000000-0000-0000-0000-000000000000';
    console.log(`Relaxing filters for dealer: ${dealerId}`);

    // Set max age to 1000 hours to allow any data from the dataset
    const { error } = await supabase
        .from('settings')
        .update({
            post_age_max: 1000,
            price_min: 0,
            price_max: 100000,
            mileage_max: 500000
        })
        .eq('id', dealerId);

    if (error) console.error('Update error:', error.message);
    else console.log('Filters relaxed.');
}

relaxFilters();
