-- Add 'Archived' as a valid status logically (though it's a text column)
-- Add INSERT policy for messages so dealers can send texts
CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = dealer_id);

-- Add UPDATE policy for leads so dealers can change status
CREATE POLICY "Users can update their own leads status" ON leads
  FOR UPDATE USING (auth.uid() = dealer_id);

-- Ensure Realtime is enabled for the leads and messages tables
-- (Note: This usually requires manual toggle in Supabase UI or extensions)
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
