-- ============================================================================
-- CRM ALVEARE - User Profile Settings Migration
-- Run this in your Supabase SQL Editor to add alert settings to user_profiles
-- ============================================================================

-- 1. ADD ALERT SETTINGS COLUMNS TO USER_PROFILES
-- ============================================================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS default_alert_time INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS enable_whatsapp_alerts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_telegram_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_sound_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_browser_notifications BOOLEAN DEFAULT true;

-- 2. CREATE PERSONAL_TASKS TABLE (if not exists)
-- ============================================================================
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

-- Indexes for personal_tasks
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_date ON personal_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_completed ON personal_tasks(is_completed);

-- Enable RLS on personal_tasks
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage own personal tasks" ON personal_tasks;

-- Users can manage their own personal tasks
CREATE POLICY "Users can manage own personal tasks" ON personal_tasks
  FOR ALL USING (auth.uid() = user_id);

-- 3. UPDATE USER_PROFILES POLICY FOR UPSERT
-- ============================================================================
-- Allow users to insert their own profile (for auto-creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- DONE! Now users' profile settings and personal tasks will persist in Supabase
-- ============================================================================
