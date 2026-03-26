import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function applyMigration() {
    console.log('Applying city rotation index migration...');

    // Use rpc to execute raw SQL with service role key
    const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE settings ADD COLUMN IF NOT EXISTS last_city_index INTEGER NOT NULL DEFAULT 0;`
    });

    if (error) {
        // Supabase doesn't expose exec_sql by default — print instructions instead
        console.error('RPC not available. Please run the following SQL in your Supabase SQL editor:\n');
        console.log('─'.repeat(60));
        console.log(`ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS last_city_index INTEGER NOT NULL DEFAULT 0;`);
        console.log('─'.repeat(60));
        return;
    }

    console.log('✅  last_city_index column added (or already existed).');

    // Verify it's there by reading a row
    const { data, error: readErr } = await supabase
        .from('settings')
        .select('id, last_city_index')
        .limit(1)
        .maybeSingle();

    if (readErr) {
        console.error('Verification select failed:', readErr.message);
    } else {
        console.log('✅  Verification OK — row sample:', data);
    }
}

applyMigration();
