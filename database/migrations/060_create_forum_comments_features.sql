-- 1. Add parent_id to support threaded replies
ALTER TABLE public.forum_comments 
ADD COLUMN parent_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE;

-- 2. Create the votes table for comments
CREATE TABLE public.forum_comment_votes (
    comment_id UUID NOT NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_value SMALLINT NOT NULL CHECK (vote_value IN (1, -1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

-- 3. Enable RLS for comment votes
ALTER TABLE public.forum_comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment votes" ON public.forum_comment_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on comments" ON public.forum_comment_votes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment vote" ON public.forum_comment_votes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment vote" ON public.forum_comment_votes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Create a secure view for comments, aggregating score and joining author_name
CREATE OR REPLACE VIEW public.forum_comments_view AS
SELECT 
    c.id,
    c.post_id,
    c.parent_id,
    c.content,
    c.is_anonymous,
    c.created_at,
    CASE 
        WHEN c.is_anonymous THEN NULL 
        ELSE c.author_id 
    END as display_author_id,
    CASE 
        WHEN c.is_anonymous THEN NULL 
        ELSE up.full_name 
    END as author_name,
    (SELECT COALESCE(SUM(v.vote_value), 0) FROM public.forum_comment_votes v WHERE v.comment_id = c.id) as score
FROM public.forum_comments c
LEFT JOIN public.user_profiles up ON c.author_id = up.id;

-- 5. Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comment_votes;
