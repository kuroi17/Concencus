-- Forum Channels
CREATE TABLE public.forum_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forum Posts
CREATE TABLE public.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.forum_channels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'General',
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forum Votes
CREATE TABLE public.forum_votes (
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_value SMALLINT NOT NULL CHECK (vote_value IN (1, -1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- Forum Comments
CREATE TABLE public.forum_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to securely fetch posts, redacting author_id if anonymous
-- This allows the frontend to safely query the view instead of the table directly.
CREATE OR REPLACE VIEW public.forum_posts_view AS
SELECT 
    p.id,
    p.channel_id,
    p.title,
    p.excerpt,
    p.tag,
    p.is_anonymous,
    p.created_at,
    CASE 
        WHEN p.is_anonymous THEN NULL 
        ELSE p.author_id 
    END as display_author_id,
    (SELECT COALESCE(SUM(v.vote_value), 0) FROM public.forum_votes v WHERE v.post_id = p.id) as score,
    (SELECT COUNT(*) FROM public.forum_comments c WHERE c.post_id = p.id) as comment_count
FROM public.forum_posts p;
