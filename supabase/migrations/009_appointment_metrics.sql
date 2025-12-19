-- ============================================================================
-- CRM ALVEARE - Appointment Metrics Migration
-- Adds appointment_type column and metrics view for tracking
-- virtual vs in-person appointments
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Add appointment_type column to scheduled_tasks
-- ============================================================================
ALTER TABLE scheduled_tasks 
ADD COLUMN IF NOT EXISTS appointment_type TEXT CHECK (appointment_type IN ('virtual', 'in_person'));

-- Comment for documentation
COMMENT ON COLUMN scheduled_tasks.appointment_type IS 'Type of appointment: virtual (video call) or in_person (physical visit)';

-- 2. Create view for appointment metrics by user and month
-- ============================================================================
CREATE OR REPLACE VIEW appointment_metrics_by_user AS
SELECT 
  st.user_id,
  up.full_name,
  up.email,
  DATE_TRUNC('month', st.scheduled_date)::DATE as month,
  COUNT(*) FILTER (WHERE st.task_type = 'visit' AND st.appointment_type = 'virtual') as virtual_appointments,
  COUNT(*) FILTER (WHERE st.task_type = 'visit' AND st.appointment_type = 'in_person') as in_person_appointments,
  COUNT(*) FILTER (WHERE st.task_type = 'visit') as total_appointments,
  COUNT(*) FILTER (WHERE st.task_type = 'visit' AND st.is_completed = true) as completed_appointments,
  COUNT(*) FILTER (WHERE st.task_type = 'visit' AND st.is_completed = true AND st.appointment_type = 'virtual') as completed_virtual,
  COUNT(*) FILTER (WHERE st.task_type = 'visit' AND st.is_completed = true AND st.appointment_type = 'in_person') as completed_in_person
FROM scheduled_tasks st
LEFT JOIN user_profiles up ON up.id = st.user_id
WHERE st.task_type = 'visit'
GROUP BY st.user_id, up.full_name, up.email, DATE_TRUNC('month', st.scheduled_date);

-- 3. Create view for team appointment summary (current month)
-- ============================================================================
CREATE OR REPLACE VIEW team_appointment_summary AS
SELECT 
  COUNT(*) FILTER (WHERE appointment_type = 'virtual') as total_virtual,
  COUNT(*) FILTER (WHERE appointment_type = 'in_person') as total_in_person,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE is_completed = true) as total_completed,
  COUNT(DISTINCT user_id) as asesores_with_appointments
FROM scheduled_tasks
WHERE task_type = 'visit'
  AND DATE_TRUNC('month', scheduled_date) = DATE_TRUNC('month', CURRENT_DATE);

-- 4. Grant access to views (RLS applies through underlying tables)
-- ============================================================================
-- Views inherit RLS from base tables, but we create policies to be explicit

-- Supervisors and admins can see all appointment metrics
CREATE POLICY IF NOT EXISTS "Supervisors can view appointment metrics" ON scheduled_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );

-- ============================================================================
-- End of migration
-- ============================================================================
