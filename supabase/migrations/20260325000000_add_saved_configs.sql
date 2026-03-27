-- Create saved_configs table
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

-- Trigger to update updated_at
CREATE TRIGGER update_saved_configs_updated_at BEFORE UPDATE ON saved_configs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
