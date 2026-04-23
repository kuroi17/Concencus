-- Migration: Add SDG Tags to Content
-- Description: Adds sdg_tags (TEXT[]) to announcements, forum_posts, and proposals.

-- 1. Update Announcements
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS sdg_tags TEXT[] DEFAULT '{}';

-- 2. Update Forum Posts
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS sdg_tags TEXT[] DEFAULT '{}';

-- 3. Update Proposals
-- First, add the new column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS sdg_tags TEXT[] DEFAULT '{}';

-- Migrate existing single sdg_tag to sdg_tags array
UPDATE public.proposals 
SET sdg_tags = ARRAY[sdg_tag] 
WHERE sdg_tag IS NOT NULL AND sdg_tags = '{}';

-- 4. Update Forum Posts View
CREATE OR REPLACE VIEW public.forum_posts_view AS
SELECT 
    p.id,
    p.channel_id,
    p.title,
    p.excerpt,
    p.tag,
    p.is_anonymous,
    p.created_at,
    p.sdg_tags, -- Added sdg_tags
    CASE 
        WHEN p.is_anonymous THEN NULL 
        ELSE p.author_id 
    END as display_author_id,
    CASE 
        WHEN p.is_anonymous THEN NULL 
        ELSE up.full_name 
    END as author_name,
    (SELECT COALESCE(SUM(v.vote_value), 0) FROM public.forum_votes v WHERE v.post_id = p.id) as score,
    (SELECT COUNT(*) FROM public.forum_comments c WHERE c.post_id = p.id) as comment_count
FROM public.forum_posts p
LEFT JOIN public.user_profiles up ON p.author_id = up.id;
