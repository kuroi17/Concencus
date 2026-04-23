-- Migration: Add has_completed_onboarding to user_profiles
-- Description: Tracks whether a user has seen the onboarding flow.

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
