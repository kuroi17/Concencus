-- Migration: Create Proposals and Voting System
-- Description: Tables for proposal submission, voting, and admin responses.

-- 1. Proposals Table
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Academic', 'Facilities', 'Policy')),
    sdg_tag TEXT, -- Optional SDG tag (e.g., 'SDG 4: Quality Education')
    status TEXT NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Draft', 'Under Review', 'Approved', 'Implemented', 'Rejected')),
    upvotes_count INT DEFAULT 0 NOT NULL,
    downvotes_count INT DEFAULT 0 NOT NULL
);

-- 2. Proposal Votes Table
CREATE TABLE IF NOT EXISTS public.proposal_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    vote_type INT NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(proposal_id, user_id)
);

-- 3. Proposal Responses Table (Admin only)
CREATE TABLE IF NOT EXISTS public.proposal_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_responses ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Proposals
-- Anyone can read proposals (for transparency)
CREATE POLICY "Anyone can view proposals" ON public.proposals
    FOR SELECT USING (true);

-- Authenticated users can create proposals
CREATE POLICY "Users can create proposals" ON public.proposals
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Authors or Admins can update their own proposals (status only by admins)
CREATE POLICY "Admins can update all proposals" ON public.proposals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND campus_role = 'admin'
        )
    );

-- 6. Policies for Proposal Votes
CREATE POLICY "Anyone can view votes" ON public.proposal_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote on proposals" ON public.proposal_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" ON public.proposal_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" ON public.proposal_votes
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Policies for Proposal Responses
CREATE POLICY "Anyone can view proposal responses" ON public.proposal_responses
    FOR SELECT USING (true);

CREATE POLICY "Only admins can respond to proposals" ON public.proposal_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND campus_role = 'admin'
        )
    );

-- 8. Functions & Triggers for Vote Counting
CREATE OR REPLACE FUNCTION public.update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 1) THEN
            UPDATE public.proposals SET upvotes_count = upvotes_count + 1 WHERE id = NEW.proposal_id;
        ELSE
            UPDATE public.proposals SET downvotes_count = downvotes_count + 1 WHERE id = NEW.proposal_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 1) THEN
            UPDATE public.proposals SET upvotes_count = upvotes_count - 1 WHERE id = OLD.proposal_id;
        ELSE
            UPDATE public.proposals SET downvotes_count = downvotes_count - 1 WHERE id = OLD.proposal_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.vote_type = NEW.vote_type) THEN
            RETURN NEW;
        END IF;
        
        IF (NEW.vote_type = 1) THEN
            UPDATE public.proposals SET upvotes_count = upvotes_count + 1, downvotes_count = downvotes_count - 1 WHERE id = NEW.proposal_id;
        ELSE
            UPDATE public.proposals SET upvotes_count = upvotes_count - 1, downvotes_count = downvotes_count + 1 WHERE id = NEW.proposal_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_proposal_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.proposal_votes
FOR EACH ROW EXECUTE FUNCTION public.update_proposal_vote_counts();

-- 9. Real-time Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_responses;
