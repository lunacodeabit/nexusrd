-- ==================================================
-- MIGRACIÓN: Agregar columnas de calificación al lead
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ==================================================

-- Agregar columnas para guardar el progreso de calificación
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS qualification_notes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS qualification_progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Asegurarnos que qualification_answers existe
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS qualification_answers JSONB DEFAULT '{}';

-- Comentario de verificación
COMMENT ON COLUMN public.leads.qualification_answers IS 'Respuestas del wizard de calificación (questionId -> answer)';
COMMENT ON COLUMN public.leads.qualification_notes IS 'Notas del wizard de calificación (questionId -> note)';
COMMENT ON COLUMN public.leads.qualification_progress IS 'Porcentaje de progreso de calificación (0-100)';
