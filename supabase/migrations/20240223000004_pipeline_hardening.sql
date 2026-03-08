-- Hardening RLS Policies for Production
-- Ensuring every table is restricted by dealer_id (auth.uid())

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Leads (Already has some policies, but let's make them robust)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own leads status" ON leads;
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT USING (auth.uid() = dealer_id);
CREATE POLICY "Users can update their own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = dealer_id);
CREATE POLICY "Users can delete their own leads" ON public.leads
  FOR DELETE USING (auth.uid() = dealer_id);
CREATE POLICY "Service role can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true); -- Webhooks need to insert

-- 4. Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = dealer_id);
CREATE POLICY "Users can insert their own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = dealer_id);

-- Enable Realtime for statuses we missed
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
