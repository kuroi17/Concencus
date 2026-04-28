-- =============================================================
-- 101_backfill_block_default.sql
-- Run each step separately in Supabase SQL Editor.
-- =============================================================


-- ── STEP 1 ───────────────────────────────────────────────────
-- See which block channels currently exist.
-- Run this first so you know what's there.
SELECT name, slug, category
FROM   public.channels
WHERE  category = 'blocks'
ORDER  BY name;


-- ── STEP 2 ───────────────────────────────────────────────────
-- Insert the CS2205 block channel if it doesn't already exist.
-- This is the ROOT CAUSE fix — the channel row was missing.
INSERT INTO public.channels (slug, name, description, category)
SELECT 'cs2205', 'CS2205', 'Block CS2205', 'blocks'
WHERE  NOT EXISTS (
    SELECT 1
    FROM   public.channels
    WHERE  category = 'blocks'
    AND    lower(replace(replace(name, ' ', ''), '-', '')) = 'cs2205'
);


-- ── STEP 3 ───────────────────────────────────────────────────
-- Normalize messy block values so they match channel names.
-- Fixes: "CS 2205" → "CS2205",  "CS-2205" → "CS2205"
UPDATE public.user_profiles
SET    block = upper(replace(replace(trim(block), ' ', ''), '-', ''))
WHERE  block IS NOT NULL
AND    block != upper(replace(replace(trim(block), ' ', ''), '-', ''));


-- ── STEP 4 ───────────────────────────────────────────────────
-- Set any remaining NULL / empty blocks to CS2205 (existing users).
UPDATE public.user_profiles
SET    block = 'CS2205'
WHERE  block IS NULL
   OR  trim(block) = '';


-- ── STEP 5 ───────────────────────────────────────────────────
-- Verify: confirm channels and users look correct.
SELECT 'block channels' AS type, name AS value FROM public.channels WHERE category = 'blocks'
UNION ALL
SELECT 'user block', full_name || ' → ' || coalesce(block, 'NULL')
FROM   public.user_profiles
ORDER  BY type, value;
