-- =====================================================
-- ALVEARE CRM - Missing Tables Migration
-- Run this in Supabase SQL Editor
-- Date: 2025-12-19
-- =====================================================

-- =====================================================
-- 1. AUTOMATION_RULES TABLE
-- Stores user automation rules for lead follow-up
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger TEXT NOT NULL, -- 'days_without_contact', 'days_in_status', 'new_lead', etc.
    trigger_value INTEGER, -- number of days, etc.
    trigger_status TEXT, -- specific status to trigger on
    action TEXT NOT NULL, -- 'show_alert', 'send_whatsapp', 'send_email', 'notify_supervisor'
    action_config JSONB DEFAULT '{}', -- { message_template, etc. }
    is_active BOOLEAN DEFAULT true,
    apply_to_statuses TEXT[], -- array of statuses this rule applies to
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for automation_rules
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

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

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(user_id, is_active);

-- =====================================================
-- 2. AUTOMATION_EXECUTIONS TABLE
-- Logs when automation rules are executed
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    lead_name TEXT,
    action_taken TEXT NOT NULL,
    result TEXT, -- 'success', 'failed', 'pending'
    details JSONB DEFAULT '{}',
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for automation_executions
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions" 
    ON automation_executions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own executions" 
    ON automation_executions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_automation_executions_user_id ON automation_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_date ON automation_executions(executed_at DESC);

-- =====================================================
-- 3. FOLLOW_UP_TRACKING TABLE
-- Tracks leads in special follow-up states
-- (waiting, paused, searching for property)
-- =====================================================
CREATE TABLE IF NOT EXISTS follow_up_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tracking_type TEXT NOT NULL CHECK (tracking_type IN ('waiting', 'paused', 'searching')),
    original_status TEXT NOT NULL, -- status before entering tracking
    reason TEXT NOT NULL,
    notes TEXT,
    contact_date DATE, -- for 'waiting' type - when to contact again
    search_criteria JSONB, -- for 'searching' type - what they're looking for
    properties_sent INTEGER DEFAULT 0, -- count of properties sent to client
    is_active BOOLEAN DEFAULT true,
    reactivated_at TIMESTAMPTZ, -- when lead was moved back to kanban
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for follow_up_tracking
ALTER TABLE follow_up_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trackings" 
    ON follow_up_tracking FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trackings" 
    ON follow_up_tracking FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trackings" 
    ON follow_up_tracking FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trackings" 
    ON follow_up_tracking FOR DELETE 
    USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_user_id ON follow_up_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_lead_id ON follow_up_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_active ON follow_up_tracking(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_type ON follow_up_tracking(tracking_type, is_active);
CREATE INDEX IF NOT EXISTS idx_follow_up_tracking_contact_date ON follow_up_tracking(contact_date) WHERE is_active = true;

-- =====================================================
-- 4. ADD appointment_type TO scheduled_tasks (if missing)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_tasks' 
        AND column_name = 'appointment_type'
    ) THEN
        ALTER TABLE scheduled_tasks 
        ADD COLUMN appointment_type TEXT CHECK (appointment_type IN ('virtual', 'in_person'));
    END IF;
END $$;

-- =====================================================
-- DONE! All tables created successfully
-- =====================================================
