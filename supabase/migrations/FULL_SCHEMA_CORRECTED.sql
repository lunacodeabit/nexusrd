-- ============================================================================
-- CRM ALVEARE - SCHEMA COMPLETO (CORREGIDO)
-- Borra todo y ejecuta esto en Supabase SQL Editor
-- https://supabase.com/dashboard/project/lldhpidjcjyjldhpbjql/sql
-- ============================================================================

-- =============================================
-- PARTE 1: TABLAS PRINCIPALES
-- =============================================

-- 1. TABLA DE PERFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'agent',
  agency_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE LEADS
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,
  
  status TEXT DEFAULT 'NEW',
  score INTEGER DEFAULT 0,
  score_category TEXT,
  qualification_answers JSONB,
  
  budget_min DECIMAL,
  budget_max DECIMAL,
  currency TEXT DEFAULT 'USD',
  preferred_zones TEXT[],
  property_type TEXT,
  bedrooms INTEGER,
  interest_area TEXT,
  
  current_follow_up INTEGER DEFAULT 0,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE SEGUIMIENTOS
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  follow_up_number INTEGER NOT NULL,
  method TEXT NOT NULL,
  response TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE PROPIEDADES
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT,
  status TEXT DEFAULT 'AVAILABLE',
  
  address TEXT,
  city TEXT,
  zone TEXT,
  
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  area_m2 DECIMAL,
  amenities TEXT[],
  
  commission_percentage DECIMAL DEFAULT 3.0,
  
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  
  images TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE ACTIVIDADES DIARIAS
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  task_id TEXT NOT NULL,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, task_id, date)
);

-- 6. TABLA DE LEADS ENTRANTES (WEBHOOK)
CREATE TABLE IF NOT EXISTS public.webhook_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  raw_data JSONB NOT NULL,
  source TEXT,
  
  name TEXT,
  phone TEXT,
  email TEXT,
  message TEXT,
  
  processed BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES auth.users(id),
  converted_lead_id UUID REFERENCES public.leads(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PARTE 2: TABLAS SUPERADMIN
-- =============================================

-- 7. USER_PROFILES (Sistema de roles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
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

-- 8. SCHEDULED_TASKS (Tareas programadas)
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
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

-- 9. ACTIVITY_LOGS (Registro de actividad)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTE 3: ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON public.daily_activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user ON public.scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_date ON public.scheduled_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);

-- =============================================
-- PARTE 4: ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 5: POLÍTICAS DE SEGURIDAD
-- =============================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Leads
DROP POLICY IF EXISTS "Users can manage own leads" ON public.leads;
CREATE POLICY "Users can manage own leads" ON public.leads
  FOR ALL USING (auth.uid() = user_id);

-- Follow-ups
DROP POLICY IF EXISTS "Users can manage own follow_ups" ON public.follow_ups;
CREATE POLICY "Users can manage own follow_ups" ON public.follow_ups
  FOR ALL USING (auth.uid() = user_id);

-- Properties
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;
CREATE POLICY "Users can manage own properties" ON public.properties
  FOR ALL USING (auth.uid() = user_id);

-- Daily Activities
DROP POLICY IF EXISTS "Users can manage own activities" ON public.daily_activities;
CREATE POLICY "Users can manage own activities" ON public.daily_activities
  FOR ALL USING (auth.uid() = user_id);

-- Webhook Leads
DROP POLICY IF EXISTS "Anyone can insert webhook leads" ON public.webhook_leads;
CREATE POLICY "Anyone can insert webhook leads" ON public.webhook_leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view webhook leads" ON public.webhook_leads;
CREATE POLICY "Users can view webhook leads" ON public.webhook_leads
  FOR SELECT USING (assigned_to IS NULL OR auth.uid() = assigned_to);

-- User Profiles (SuperAdmin)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = id
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Scheduled Tasks
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.scheduled_tasks;
CREATE POLICY "Users can manage own tasks" ON public.scheduled_tasks
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
  );

-- Activity Logs
DROP POLICY IF EXISTS "Users can manage own activity" ON public.activity_logs;
CREATE POLICY "Users can manage own activity" ON public.activity_logs
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
  );

-- =============================================
-- PARTE 6: FUNCIONES Y TRIGGERS
-- =============================================

-- Auto-crear perfil cuando se registra usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en profiles (tabla original)
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  
  -- Insertar en user_profiles (tabla de roles)
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

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- PARTE 7: INSERTAR DATOS INICIALES
-- =============================================

-- Insertar perfiles para usuarios existentes en user_profiles
INSERT INTO public.user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'asesor'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PARTE 8: HACER A HOWARD ADMIN
-- =============================================
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'howard@alveare.do';

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================
SELECT id, email, full_name, role, is_active FROM public.user_profiles;

-- ============================================================================
-- ¡LISTO! howard@alveare.do ahora es ADMIN
-- Recarga la app (F5) para ver el botón "SuperAdmin" en el sidebar
-- ============================================================================
