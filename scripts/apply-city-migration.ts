import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function applyMigration() {
    console.log('Applying migration: Add city column...');
    
    // Using rpc or direct query if possible, but Supabase JS doesn't support direct DDL
    // We can try to just insert a record with the new column and see if it fails,
    // but the proper way is SQL.
    // If there's no SQL execution tool, I'll inform the user or check if there's a script that runs migrations.
    
    console.log('NOTE: Please run the SQL in supabase/migrations/20260317000000_add_city_to_leads.sql manually in Supabase SQL Editor if automation fails.');
    
    // Testing if column exists by trying to fetch it
    const { error } = await supabase.from('leads').select('city').limit(1);
    if (error && error.message.includes('column "city" does not exist')) {
        console.error('Migration required: Column "city" does not exist.');
    } else if (error) {
        console.error('Error checking column:', error.message);
    } else {
        console.log('Column "city" already exists or migration applied successfully.');
    }
}

applyMigration();
