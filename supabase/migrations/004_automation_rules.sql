-- ============================================
-- TABLAS DE AUTOMATIZACIONES - CRM ALVEARE
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla: automation_rules
-- Almacena las reglas de automatización configuradas por cada usuario
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL CHECK (trigger IN (
    'days_without_contact',
    'days_in_status',
    'follow_up_overdue',
    'no_response_after_contact',
    'lead_gone_cold'
  )),
  trigger_value INTEGER NOT NULL DEFAULT 3,
  trigger_status TEXT, -- Para 'days_in_status'
  action TEXT NOT NULL CHECK (action IN (
    'send_whatsapp',
    'send_email',
    'create_task',
    'notify_supervisor',
    'change_status',
    'show_alert'
  )),
  action_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  apply_to_statuses TEXT[], -- NULL = todos los status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_automation_rules_user ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active) WHERE is_active = true;

-- Tabla: automation_executions
-- Historial de automatizaciones ejecutadas
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  action_taken TEXT NOT NULL,
  result TEXT CHECK (result IN ('success', 'pending', 'failed')),
  details TEXT
);

-- Índices para el historial
CREATE INDEX IF NOT EXISTS idx_automation_exec_rule ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_exec_lead ON automation_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_automation_exec_date ON automation_executions(executed_at DESC);

-- RLS: Políticas de seguridad
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver/editar sus propias reglas
CREATE POLICY "Users can view own automation rules"
  ON automation_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation rules"
  ON automation_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation rules"
  ON automation_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automation rules"
  ON automation_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Ejecutions: usuarios ven las de sus reglas
CREATE POLICY "Users can view executions of own rules"
  ON automation_executions FOR SELECT
  USING (
    rule_id IN (SELECT id FROM automation_rules WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert executions for own rules"
  ON automation_executions FOR INSERT
  WITH CHECK (
    rule_id IN (SELECT id FROM automation_rules WHERE user_id = auth.uid())
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_automation_rule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_rules_updated
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_rule_timestamp();

-- ============================================
-- REGLAS PREDETERMINADAS (Opcional)
-- Se pueden insertar después de que el usuario crea su cuenta
-- ============================================

-- Función para crear reglas por defecto para nuevos usuarios
CREATE OR REPLACE FUNCTION create_default_automation_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear si el usuario es asesor
  IF NEW.role IN ('asesor', 'admin', 'supervisor') THEN
    INSERT INTO automation_rules (user_id, name, description, trigger, trigger_value, action, action_config, is_active, apply_to_statuses)
    VALUES 
      (NEW.user_id, '⚠️ Lead sin contacto 2 días', 'Alerta cuando un lead lleva 2 días sin contacto', 'days_without_contact', 2, 'show_alert', '{"message_template": "¡Atención! {lead_name} lleva {days} días sin contacto. ¡Contáctalo ahora!"}'::jsonb, true, ARRAY['NUEVO', 'CONTACTADO', 'VISITA_AGENDADA', 'NEGOCIACION']),
      (NEW.user_id, '📱 WhatsApp automático 3 días', 'Sugiere enviar WhatsApp después de 3 días', 'days_without_contact', 3, 'send_whatsapp', '{"message_template": "Hola {lead_name}, espero que estés bien. ¿Has tenido tiempo de pensar sobre las propiedades que vimos? Estoy aquí para ayudarte con cualquier duda. 🏠"}'::jsonb, true, ARRAY['CONTACTADO', 'VISITA_AGENDADA']),
      (NEW.user_id, '🚨 Notificar supervisor 5 días', 'Notifica al supervisor si un lead lleva 5 días sin contacto', 'days_without_contact', 5, 'notify_supervisor', '{"message_template": "El lead {lead_name} lleva {days} días sin atención. Requiere intervención."}'::jsonb, true, ARRAY['NUEVO', 'CONTACTADO']),
      (NEW.user_id, '❄️ Lead estancado en Negociación', 'Alerta si un lead lleva más de 7 días en negociación', 'days_in_status', 7, 'show_alert', '{"message_template": "{lead_name} lleva {days} días en negociación. ¿Necesita un incentivo para cerrar?"}'::jsonb, true, NULL);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear reglas cuando se crea un user_profile
-- (Descomenta si quieres reglas automáticas para nuevos usuarios)
-- CREATE TRIGGER create_default_rules_on_profile
--   AFTER INSERT ON user_profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION create_default_automation_rules();
