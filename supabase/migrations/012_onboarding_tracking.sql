-- Add onboarding tracking columns to user_profiles
-- Run this migration in Supabase SQL Editor

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Comment for documentation
COMMENT ON COLUMN user_profiles.onboarding_completed IS 'Whether user has completed the onboarding wizard';
COMMENT ON COLUMN user_profiles.onboarding_completed_at IS 'When user completed the onboarding wizard';
