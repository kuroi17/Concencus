-- Migration: Add image support and anonymity to proposals
-- Description: Adds columns to the proposals table for images and anonymous posting.

ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
