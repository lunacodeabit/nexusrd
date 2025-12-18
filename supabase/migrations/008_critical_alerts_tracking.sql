-- Migration: Add critical alert tracking fields to leads table
-- Purpose: Track when alerts have been sent to avoid duplicates

-- Add columns for tracking critical alerts
ALTER TABLE leads ADD COLUMN IF NOT EXISTS alert_2h_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS alert_24h_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS alert_2h_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS alert_24h_sent_at TIMESTAMPTZ;

-- Index for faster queries on leads needing alerts
CREATE INDEX IF NOT EXISTS idx_leads_alert_status ON leads (alert_2h_sent, alert_24h_sent, status, created_at);

-- Comment explaining the fields
COMMENT ON COLUMN leads.alert_2h_sent IS 'True if 2-hour critical alert has been sent for this lead';
COMMENT ON COLUMN leads.alert_24h_sent IS 'True if 24-hour critical alert has been sent for this lead';
