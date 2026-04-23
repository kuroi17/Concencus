-- Migration: Add delete policies to proposals
-- Description: Allows authors to delete their own proposals and admins to delete any proposal.

CREATE POLICY "Authors can delete their own proposals" ON public.proposals
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any proposal" ON public.proposals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND campus_role = 'admin'
        )
    );
