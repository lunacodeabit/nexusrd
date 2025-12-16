-- ============================================================================
-- CRM ALVEARE - SuperAdmin Migration
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. USER PROFILES TABLE (with roles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'asesor' CHECK (role IN ('asesor', 'supervisor', 'admin')),
  team_id UUID, -- For future team grouping
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team ON user_profiles(team_id);

-- 2. SCHEDULED TASKS TABLE (migrate from localStorage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  task_type TEXT NOT NULL, -- 'call', 'whatsapp', 'visit', 'email', 'other'
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user ON scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON scheduled_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON scheduled_tasks(is_completed);

-- 3. ACTIVITY LOGS TABLE (for tracking everything)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'lead_created', 'lead_updated', 'task_completed', 'call_made', 'login', etc.
  entity_type TEXT, -- 'lead', 'task', 'property'
  entity_id UUID,
  metadata JSONB DEFAULT '{}', -- Additional data about the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying activity
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(action_type);

-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Supervisors can view team profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );

-- Scheduled Tasks Policies
CREATE POLICY "Users can manage own tasks" ON scheduled_tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Supervisors can view all tasks" ON scheduled_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );

-- Activity Logs Policies
CREATE POLICY "Users can insert own activity" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Supervisors can view all activity" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );

-- 5. TRIGGER: Auto-create profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. VIEWS FOR SUPERADMIN DASHBOARD
-- ============================================================================

-- Team Performance Summary
CREATE OR REPLACE VIEW team_performance AS
SELECT 
  up.id as user_id,
  up.full_name,
  up.email,
  up.role,
  up.is_active,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'CERRADO_GANADO' THEN l.id END) as leads_won,
  COUNT(DISTINCT CASE WHEN l.status = 'CERRADO_PERDIDO' THEN l.id END) as leads_lost,
  COUNT(DISTINCT CASE WHEN l.created_at >= NOW() - INTERVAL '7 days' THEN l.id END) as leads_this_week,
  COUNT(DISTINCT st.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN st.is_completed THEN st.id END) as tasks_completed,
  MAX(al.created_at) as last_activity
FROM user_profiles up
LEFT JOIN leads l ON l.user_id = up.id
LEFT JOIN scheduled_tasks st ON st.user_id = up.id
LEFT JOIN activity_logs al ON al.user_id = up.id
WHERE up.role = 'asesor'
GROUP BY up.id, up.full_name, up.email, up.role, up.is_active;

-- Daily Activity Summary by User
CREATE OR REPLACE VIEW daily_activity_summary AS
SELECT 
  user_id,
  DATE(created_at) as activity_date,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN action_type = 'lead_created' THEN 1 END) as leads_created,
  COUNT(CASE WHEN action_type = 'lead_updated' THEN 1 END) as leads_updated,
  COUNT(CASE WHEN action_type = 'task_completed' THEN 1 END) as tasks_completed,
  COUNT(CASE WHEN action_type = 'call_made' THEN 1 END) as calls_made,
  COUNT(CASE WHEN action_type = 'whatsapp_sent' THEN 1 END) as whatsapp_sent
FROM activity_logs
GROUP BY user_id, DATE(created_at);

-- 7. HELPER FUNCTION: Check if user is supervisor
-- ============================================================================
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('supervisor', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. INSERT PROFILE FOR EXISTING USERS (run once)
-- ============================================================================
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'asesor'
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TO MAKE A USER SUPERVISOR, RUN:
-- UPDATE user_profiles SET role = 'supervisor' WHERE email = 'your-email@example.com';
-- ============================================================================
