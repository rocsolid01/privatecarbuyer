import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSavedConfigsTable() {
    console.log('Creating saved_configs table...');
    
    // We use rpc() if we have a custom function, but since we don't, 
    // we'll try to just query it to see if it exists, and if not, we'll advise the user
    // because Supabase client doesn't support raw SQL unless via RPC.
    
    const { error: checkError } = await supabase
        .from('saved_configs')
        .select('id')
        .limit(1);

    if (checkError && checkError.code === '42P01') { // 42P01 is "relation does not exist"
        console.log('Table saved_configs does not exist. Please run the migration SQL in your Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS saved_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID REFERENCES profiles(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000000',
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saved configs" ON saved_configs
  FOR SELECT USING (auth.uid() = dealer_id OR dealer_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can insert their own saved configs" ON saved_configs
  FOR INSERT WITH CHECK (auth.uid() = dealer_id OR dealer_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can update their own saved configs" ON saved_configs
  FOR UPDATE USING (auth.uid() = dealer_id OR dealer_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can delete their own saved configs" ON saved_configs
  FOR DELETE USING (auth.uid() = dealer_id OR dealer_id = '00000000-0000-0000-0000-000000000000');

-- Add unique constraint for name per dealer
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_configs_name_dealer ON saved_configs (name, dealer_id);
        `);
    } else if (checkError) {
        console.error('Error checking table:', checkError.message);
    } else {
        console.log('Table saved_configs ALREADY EXISTS');
    }
}

createSavedConfigsTable();
