-- Enable RLS
ALTER TABLE public.forum_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- Forum Channels Policies
CREATE POLICY "Anyone can view channels" ON public.forum_channels
    FOR SELECT USING (true);

-- Forum Posts Policies
CREATE POLICY "Anyone can view posts" ON public.forum_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert posts" ON public.forum_posts
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own non-anonymous posts" ON public.forum_posts
    FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON public.forum_posts
    FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Forum Votes Policies
CREATE POLICY "Anyone can view votes" ON public.forum_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.forum_votes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vote" ON public.forum_votes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vote" ON public.forum_votes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Forum Comments Policies
CREATE POLICY "Anyone can view comments" ON public.forum_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.forum_comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON public.forum_comments
    FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON public.forum_comments
    FOR DELETE TO authenticated USING (auth.uid() = author_id);
