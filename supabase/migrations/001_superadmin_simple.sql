-- ============================================================================
-- CRM ALVEARE - SuperAdmin Migration (SIMPLIFICADO)
-- Ejecuta esto en: https://supabase.com/dashboard/project/lldhpidjcjyjldhpbjql/sql
-- ============================================================================

-- 1. CREAR TABLA USER_PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'asesor' CHECK (role IN ('asesor', 'supervisor', 'admin')),
  team_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR TABLA SCHEDULED_TASKS (para migrar de localStorage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  task_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREAR TABLA ACTIVITY_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HABILITAR ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURIDAD
-- ============================================================================

-- User Profiles: Todos pueden ver todos (para que admins puedan gestionar)
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

-- User Profiles: Admins pueden actualizar cualquier perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Profiles: Usuarios pueden insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Scheduled Tasks: Usuarios ven sus tareas, supervisores ven todas
DROP POLICY IF EXISTS "Users can manage own tasks" ON scheduled_tasks;
CREATE POLICY "Users can manage own tasks" ON scheduled_tasks
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- Activity Logs: Similar a tasks
DROP POLICY IF EXISTS "Users can manage own activity" ON activity_logs;
CREATE POLICY "Users can manage own activity" ON activity_logs
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- 6. TRIGGER: Crear perfil automáticamente al registrarse
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. INSERTAR PERFILES PARA USUARIOS EXISTENTES
-- ============================================================================
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'asesor'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 8. HACER A HOWARD ADMIN
-- ============================================================================
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'howard@alveare.do';

-- ============================================================================
-- ¡LISTO! Ahora howard@alveare.do es ADMIN
-- Recarga la app para ver el botón "SuperAdmin" en el sidebar
-- ============================================================================
