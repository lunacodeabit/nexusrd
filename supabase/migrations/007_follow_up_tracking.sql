-- ============================================================================
-- CRM ALVEARE - Follow-up Tracking System
-- Tabla para gestionar leads en seguimiento (En Espera, Pausados, Búsquedas)
-- ============================================================================

-- Tipos de seguimiento
-- 'waiting' = En Espera (banco, documentos, etc.)
-- 'paused' = Pausados (cliente pausó búsqueda)
-- 'searching' = Búsquedas activas (cliente busca propiedades específicas)

CREATE TABLE IF NOT EXISTS follow_up_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Tipo de seguimiento
  tracking_type TEXT NOT NULL CHECK (tracking_type IN ('waiting', 'paused', 'searching')),
  
  -- Estado original del lead antes de moverlo a seguimiento
  original_status TEXT NOT NULL,
  
  -- Información común
  reason TEXT NOT NULL, -- Razón: "Esperando aprobación banco", "Viaja 2 meses", etc.
  notes TEXT, -- Notas adicionales
  contact_date DATE, -- Fecha para contactar/fecha estimada
  
  -- Solo para 'searching' (Búsquedas)
  search_criteria JSONB, -- {zones: [], bedrooms: {min, max}, budget: {min, max}, propertyType: '', features: []}
  properties_sent INTEGER DEFAULT 0, -- Contador de propiedades enviadas
  
  -- Control
  is_active BOOLEAN DEFAULT true, -- False cuando se reactiva o cancela
  reactivated_at TIMESTAMPTZ, -- Cuando el lead volvió al Kanban
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un lead solo puede estar en un tracking activo a la vez
  CONSTRAINT unique_active_tracking UNIQUE (lead_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracking_user ON follow_up_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_lead ON follow_up_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_tracking_type ON follow_up_tracking(tracking_type);
CREATE INDEX IF NOT EXISTS idx_tracking_active ON follow_up_tracking(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tracking_contact_date ON follow_up_tracking(contact_date) WHERE is_active = true;

-- Enable RLS
ALTER TABLE follow_up_tracking ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own tracking" ON follow_up_tracking;
DROP POLICY IF EXISTS "Users can insert own tracking" ON follow_up_tracking;
DROP POLICY IF EXISTS "Users can update own tracking" ON follow_up_tracking;
DROP POLICY IF EXISTS "Users can delete own tracking" ON follow_up_tracking;

CREATE POLICY "Users can view own tracking" ON follow_up_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracking" ON follow_up_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracking" ON follow_up_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracking" ON follow_up_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracking_updated ON follow_up_tracking;
CREATE TRIGGER tracking_updated
  BEFORE UPDATE ON follow_up_tracking
  FOR EACH ROW EXECUTE FUNCTION update_tracking_timestamp();

-- ============================================================================
-- Vista para obtener tracking con datos del lead
-- ============================================================================
CREATE OR REPLACE VIEW follow_up_tracking_with_leads AS
SELECT 
  t.*,
  l.name as lead_name,
  l.phone as lead_phone,
  l.email as lead_email,
  l.budget as lead_budget,
  l.currency as lead_currency,
  l.source as lead_source,
  l.interest_area as lead_interest_area,
  -- Días hasta contacto
  CASE 
    WHEN t.contact_date IS NOT NULL 
    THEN t.contact_date - CURRENT_DATE 
    ELSE NULL 
  END as days_until_contact,
  -- Días desde creación
  CURRENT_DATE - t.created_at::date as days_in_tracking
FROM follow_up_tracking t
JOIN leads l ON t.lead_id = l.id
WHERE t.is_active = true;

-- ============================================================================
-- Función para mover lead a seguimiento
-- ============================================================================
CREATE OR REPLACE FUNCTION move_lead_to_tracking(
  p_lead_id UUID,
  p_user_id UUID,
  p_tracking_type TEXT,
  p_reason TEXT,
  p_contact_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_search_criteria JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_original_status TEXT;
  v_tracking_id UUID;
BEGIN
  -- Obtener status actual del lead
  SELECT status INTO v_original_status FROM leads WHERE id = p_lead_id;
  
  IF v_original_status IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  
  -- Desactivar cualquier tracking previo de este lead
  UPDATE follow_up_tracking 
  SET is_active = false, updated_at = NOW()
  WHERE lead_id = p_lead_id AND is_active = true;
  
  -- Crear nuevo tracking
  INSERT INTO follow_up_tracking (
    user_id, lead_id, tracking_type, original_status, 
    reason, contact_date, notes, search_criteria
  ) VALUES (
    p_user_id, p_lead_id, p_tracking_type, v_original_status,
    p_reason, p_contact_date, p_notes, p_search_criteria
  ) RETURNING id INTO v_tracking_id;
  
  -- Actualizar lead a status especial (opcional: crear status 'EN_SEGUIMIENTO')
  -- Por ahora solo agregamos una nota
  UPDATE leads 
  SET notes = COALESCE(notes, '') || E'\n[' || NOW()::date || '] Movido a seguimiento: ' || p_reason,
      updated_at = NOW()
  WHERE id = p_lead_id;
  
  RETURN v_tracking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Función para reactivar lead desde seguimiento
-- ============================================================================
CREATE OR REPLACE FUNCTION reactivate_lead_from_tracking(
  p_tracking_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_lead_id UUID;
  v_original_status TEXT;
  v_tracking_type TEXT;
BEGIN
  -- Obtener datos del tracking
  SELECT lead_id, original_status, tracking_type 
  INTO v_lead_id, v_original_status, v_tracking_type
  FROM follow_up_tracking 
  WHERE id = p_tracking_id AND user_id = p_user_id AND is_active = true;
  
  IF v_lead_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Desactivar el tracking
  UPDATE follow_up_tracking 
  SET is_active = false, reactivated_at = NOW(), updated_at = NOW()
  WHERE id = p_tracking_id;
  
  -- Restaurar lead a su status original
  UPDATE leads 
  SET status = v_original_status,
      notes = COALESCE(notes, '') || E'\n[' || NOW()::date || '] Reactivado desde seguimiento',
      updated_at = NOW()
  WHERE id = v_lead_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
