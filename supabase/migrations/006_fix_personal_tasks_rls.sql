-- ============================================================================
-- FIX: Personal Tasks RLS for Server-Side Access
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. First, make sure the table exists
CREATE TABLE IF NOT EXISTS personal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'personal',
  priority TEXT NOT NULL DEFAULT 'medium',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  alert_minutes_before INTEGER,
  alert_sent BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  lead_id UUID,
  lead_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_date ON personal_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_completed ON personal_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_alert ON personal_tasks(scheduled_date, alert_sent, is_completed);

-- 3. Enable RLS
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Drop ALL existing policies
DROP POLICY IF EXISTS "Users can manage own personal tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON personal_tasks;
DROP POLICY IF EXISTS "Service role full access" ON personal_tasks;

-- 5. Create policies for authenticated users
CREATE POLICY "Users can view own tasks" ON personal_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON personal_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON personal_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON personal_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 6. IMPORTANT: Service Role bypasses RLS automatically when using service_role key
-- No extra policy needed - just make sure you have SUPABASE_SERVICE_KEY set in Netlify

-- 7. Verify: Show existing tasks (run this to see if there's any data)
SELECT 
  id, 
  title, 
  scheduled_date, 
  scheduled_time, 
  alert_minutes_before, 
  alert_sent,
  user_id
FROM personal_tasks 
ORDER BY scheduled_date DESC 
LIMIT 10;
