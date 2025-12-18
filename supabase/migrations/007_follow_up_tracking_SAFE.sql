-- ============================================================================
-- CRM ALVEARE - Follow-up Tracking System (SAFE ADD-ON)
-- SOLO AÑADE - No modifica ni elimina nada existente
-- ============================================================================

-- ============================================================================
-- 1. NUEVA TABLA: follow_up_tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.follow_up_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Tipo de seguimiento: 'waiting', 'paused', 'searching'
  tracking_type TEXT NOT NULL CHECK (tracking_type IN ('waiting', 'paused', 'searching')),
  
  -- Estado original del lead antes de moverlo
  original_status TEXT NOT NULL,
  
  -- Información común
  reason TEXT NOT NULL,
  notes TEXT,
  contact_date DATE,
  
  -- Solo para 'searching' (Búsquedas)
  search_criteria JSONB,
  properties_sent INTEGER DEFAULT 0,
  
  -- Control
  is_active BOOLEAN DEFAULT true,
  reactivated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ÍNDICES para follow_up_tracking
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_user ON public.follow_up_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_lead ON public.follow_up_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_type ON public.follow_up_tracking(tracking_type);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_active ON public.follow_up_tracking(is_active) WHERE is_active = true;

-- ============================================================================
-- 3. RLS para follow_up_tracking
-- ============================================================================
ALTER TABLE public.follow_up_tracking ENABLE ROW LEVEL SECURITY;

-- Política única para todas las operaciones
CREATE POLICY "Users can manage own tracking" ON public.follow_up_tracking
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TRIGGER para auto-actualizar updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_follow_up_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_follow_up_tracking_updated_at ON public.follow_up_tracking;
CREATE TRIGGER update_follow_up_tracking_updated_at
  BEFORE UPDATE ON public.follow_up_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_up_tracking_timestamp();

-- ============================================================================
-- LISTO! La tabla follow_up_tracking está creada
-- ============================================================================
-- Verifica con: SELECT * FROM follow_up_tracking;
