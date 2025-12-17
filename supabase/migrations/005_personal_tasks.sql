-- ============================================
-- TABLA PERSONAL_TASKS - Planner Diario
-- CRM ALVEARE
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla: personal_tasks
-- Tareas personales del planner diario de cada usuario
CREATE TABLE IF NOT EXISTS personal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Task info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'trabajo' CHECK (category IN ('personal', 'trabajo', 'cliente', 'admin', 'otro')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baja')),
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Alerts
  alert_minutes_before INTEGER DEFAULT 15,
  alert_sent BOOLEAN DEFAULT false,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  recurrence_days INTEGER[], -- [1,3,5] = Lun, Mie, Vie para weekly
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_date ON personal_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_date ON personal_tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_pending ON personal_tasks(user_id, scheduled_date) 
  WHERE is_completed = false;

-- RLS: Políticas de seguridad
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver solo sus propias tareas
CREATE POLICY "Users can view own personal tasks"
  ON personal_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personal tasks"
  ON personal_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal tasks"
  ON personal_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal tasks"
  ON personal_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_personal_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personal_tasks_updated
  BEFORE UPDATE ON personal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_task_timestamp();

-- ============================================
-- FUNCIÓN: Crear tareas recurrentes
-- Ejecutar diariamente via pg_cron o Edge Function
-- ============================================

CREATE OR REPLACE FUNCTION create_recurring_tasks()
RETURNS void AS $$
DECLARE
  task RECORD;
  next_date DATE;
BEGIN
  FOR task IN 
    SELECT * FROM personal_tasks 
    WHERE is_recurring = true 
    AND is_completed = true
    AND scheduled_date < CURRENT_DATE
  LOOP
    -- Calcular próxima fecha según patrón
    CASE task.recurrence_pattern
      WHEN 'daily' THEN
        next_date := CURRENT_DATE;
      WHEN 'weekly' THEN
        next_date := CURRENT_DATE + INTERVAL '7 days';
      WHEN 'monthly' THEN
        next_date := CURRENT_DATE + INTERVAL '1 month';
      ELSE
        next_date := NULL;
    END CASE;
    
    -- Crear nueva instancia si corresponde
    IF next_date IS NOT NULL THEN
      INSERT INTO personal_tasks (
        user_id, title, description, category, priority,
        scheduled_date, scheduled_time, duration_minutes,
        alert_minutes_before, is_recurring, recurrence_pattern, recurrence_days
      )
      VALUES (
        task.user_id, task.title, task.description, task.category, task.priority,
        next_date, task.scheduled_time, task.duration_minutes,
        task.alert_minutes_before, task.is_recurring, task.recurrence_pattern, task.recurrence_days
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Vista: Tareas de hoy con alertas pendientes
-- ============================================

CREATE OR REPLACE VIEW today_tasks_with_alerts AS
SELECT 
  pt.*,
  up.full_name as user_name,
  (pt.scheduled_time - (pt.alert_minutes_before || ' minutes')::interval)::time as alert_time
FROM personal_tasks pt
JOIN user_profiles up ON pt.user_id = up.user_id
WHERE pt.scheduled_date = CURRENT_DATE
  AND pt.is_completed = false
  AND pt.scheduled_time IS NOT NULL
  AND pt.alert_minutes_before > 0
  AND pt.alert_sent = false;
