import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, LayoutGrid } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ProposalCard from "./ProposalCard";
import CreateProposalModal from "./CreateProposalModal";
import ProposalDetailModal from "./ProposalDetailModal";
import toast from "react-hot-toast";
import { ProposalCardSkeleton } from "../../common/Skeleton";

import { EmptyState } from "../../common/EmptyState";
import { useLayout } from "../layouts/MainLayout";
import { useEscapeKey } from "../../hooks/useEscapeKey";

function ProposalBoard({ channelId, isAdmin, socket }) {
  const { setGlobalBackdropVisible } = useLayout();
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [userVotes, setUserVotes] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);


  useEffect(() => {
    const loadProposals = async () => {
      if (!channelId) { setIsLoading(false); return; }
      setIsLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) setCurrentUserId(authData.user.id);

      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          author:user_profiles!author_id(full_name, avatar_url),
          responses:proposal_responses(
            *,
            admin:user_profiles!admin_id(full_name)
          )
        `)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Error fetching proposals:", error);
        setProposals([]);
      } else {
        setProposals(data.map(p => ({
          ...p,
          author_name: p.author?.full_name,
          author_avatar: p.author?.avatar_url,
          responses: (p.responses || []).map(r => ({ ...r, admin_name: r.admin?.full_name }))
        })));
      }
      setIsLoading(false);
    };

    const loadUserVotes = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("proposal_votes")
        .select("proposal_id, vote_type")
        .eq("user_id", user.id);

      if (error || !data) {
        console.error("Error fetching user votes:", error);
      } else {
        const votes = {};
        data.forEach(v => votes[v.proposal_id] = v.vote_type);
        setUserVotes(votes);
      }
    };

    loadProposals();
    loadUserVotes();

    // ── Supabase Realtime ───────────────────────────────────────────
    const channel = supabase
      .channel(`proposals:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data, error } = await supabase
              .from("proposals")
              .select(`
                *,
                author:user_profiles!author_id(full_name, avatar_url),
                responses:proposal_responses(
                  *,
                  admin:user_profiles!admin_id(full_name)
                )
              `)
              .eq("id", payload.new.id)
              .single();

            if (!error && data) {
              const formatted = {
                ...data,
                author_name: data.author?.full_name,
                author_avatar: data.author?.avatar_url,
                responses: (data.responses || []).map(r => ({ ...r, admin_name: r.admin?.full_name }))
              };
              setProposals(prev => {
                if (prev.find(p => p.id === formatted.id)) return prev;
                return [formatted, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setProposals(prev => prev.map(p => 
              p.id === payload.new.id 
                ? { ...p, ...payload.new } 
                : p
            ));
          } else if (payload.eventType === "DELETE") {
            setProposals(prev => prev.filter(p => p.id === payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposal_votes"
        },
        async (payload) => {
          // When a vote changes, we need to refresh the counts for that proposal
          const proposalId = payload.new?.proposal_id || payload.old?.proposal_id;
          if (!proposalId) return;

          const { data, error } = await supabase
            .from("proposals")
            .select("upvotes_count, downvotes_count")
            .eq("id", proposalId)
            .single();

          if (!error && data) {
            setProposals(prev => prev.map(p => 
              p.id === proposalId 
                ? { ...p, upvotes_count: data.upvotes_count, downvotes_count: data.downvotes_count }
                : p
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const handleCreateProposal = async (proposalData) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      toast.error("Please log in to submit a proposal.");
      return false;
    }

    const { title, description, category, sdgTags, isAnonymous } = proposalData;

    try {
      const { error: insertError } = await supabase
        .from("proposals")
        .insert([{
          title,
          description,
          category,
          sdg_tags: sdgTags || [],
          is_anonymous: !!isAnonymous,
          author_id: user.id,
          channel_id: channelId
        }]);

      if (insertError) {
        console.error("Database Error:", insertError);
        toast.error(`Post failed: ${insertError.message}`);
        return false;
      }

      toast.success("Proposal submitted successfully!");
      return true;
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An unexpected error occurred during submission.");
      return false;
    }
  };

  const handleVote = async (proposalId, voteType) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      toast.error("Please log in to vote.");
      return;
    }

    const currentVote = userVotes[proposalId];
    const prevUserVotes = { ...userVotes };

    // ── Optimistic Update (Local UI Only) ─────────────────────────
    if (currentVote === voteType) {
      setUserVotes(prev => { const n = { ...prev }; delete n[proposalId]; return n; });
    } else {
      setUserVotes(prev => ({ ...prev, [proposalId]: voteType }));
    }

    // ── Database Sync ─────────────────────────────────────────────
    try {
      if (currentVote === voteType) {
        const { error } = await supabase
          .from("proposal_votes")
          .delete()
          .eq("proposal_id", proposalId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("proposal_votes")
          .upsert({
            proposal_id: proposalId,
            user_id: user.id,
            vote_type: voteType
          }, { onConflict: 'proposal_id,user_id' });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Vote sync failed:", err);
      setUserVotes(prevUserVotes);
      toast.error("Failed to sync vote: " + (err.message || "Unknown error"));
    }
  };

  const handleStatusChange = async (proposalId, nextStatus) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: nextStatus })
      .eq("id", proposalId);

    if (error) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const [deletingProposalId, setDeletingProposalId] = useState(null);
  const [respondingProposalId, setRespondingProposalId] = useState(null);
  const [adminResponseBody, setAdminResponseBody] = useState("");

  const handleAddResponse = async () => {
    if (!adminResponseBody.trim()) return;

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return;
    
    const { error } = await supabase
      .from("proposal_responses")
      .insert([{
        proposal_id: respondingProposalId,
        admin_id: user.id,
        body: adminResponseBody.trim()
      }]);

    if (!error) {
      toast.success("Response added");
      setRespondingProposalId(null);
      setAdminResponseBody("");
    } else {
      toast.error("Failed to add response: " + error.message);
    }
  };

  const handleDeleteProposal = async () => {
    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", deletingProposalId);

    if (error) {
      toast.error("Failed to delete proposal: " + error.message);
    } else {
      toast.success("Proposal deleted");
      setDeletingProposalId(null);
    }
  };

  const filteredProposals = proposals
    .filter(p => filter === "All" || p.category === filter)
    .sort((a, b) => {
      if (sortBy === "votes") return (b.upvotes_count - b.downvotes_count) - (a.upvotes_count - a.downvotes_count);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Stats for the summary bar
  const stats = {
    total: proposals.length,
    underReview: proposals.filter(p => p.status === "Under Review").length,
    approved: proposals.filter(p => p.status === "Approved").length,
    implemented: proposals.filter(p => p.status === "Implemented").length,
  };

  useEffect(() => {
    const hasOpenModal = Boolean(isModalOpen || deletingProposalId || respondingProposalId);
    setGlobalBackdropVisible("proposal-board-modals", hasOpenModal);
    return () => setGlobalBackdropVisible("proposal-board-modals", false);
  }, [isModalOpen, deletingProposalId, respondingProposalId, setGlobalBackdropVisible]);
  useEscapeKey(Boolean(deletingProposalId), () => setDeletingProposalId(null));
  useEscapeKey(Boolean(respondingProposalId), () => {
    setRespondingProposalId(null);
    setAdminResponseBody("");
  });

  return (
    <div className="space-y-6">
<<<<<<< HEAD
      <div className="mb-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* ── Tag Filters ────────────────────────────────────────────────── */}
            <nav className="flex flex-wrap items-center gap-2" aria-label="Filter proposals by category">
              {["All", "Academic", "Facilities", "Policy"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    filter === cat
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg shadow-slate-900/20"
                      : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

=======
      {/* ── Board Header ─────────────────────────────────────── */}
      <div className="space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-lg font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Proposals</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
              {stats.total} total · {stats.underReview} under review · {stats.approved} approved · {stats.implemented} implemented
            </p>
          </div>
          <div className="flex items-center gap-3">
>>>>>>> 260d440 (feat: improve Proposals page UX with modal detail view and layout fixes)
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                onClick={() => setSortBy("recent")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${sortBy === "recent" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy("votes")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${sortBy === "votes" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                Top Voted
              </button>
            </div>
<<<<<<< HEAD
=======
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#800000] px-5 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0"
            >
              <Plus size={15} />
              <span>New Proposal</span>
            </button>
>>>>>>> 260d440 (feat: improve Proposals page UX with modal detail view and layout fixes)
          </div>

<<<<<<< HEAD
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#800000] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0 disabled:opacity-70"
          >
            <Plus size={16} />
            <span>Create Proposal</span>
          </button>
        </header>
=======
        {/* ── Status summary strip ────────────────────────────── */}
        {!isLoading && proposals.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Under Review", count: stats.underReview, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800/30" },
              { label: "Approved", count: stats.approved, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/30" },
              { label: "Implemented", count: stats.implemented, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/30" },
              { label: "Total", count: stats.total, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" },
            ].map(s => (
              <div key={s.label} className={`flex flex-col items-center rounded-xl border px-2 py-2 ${s.bg} ${s.border}`}>
                <span className={`text-xl font-black tabular-nums ${s.color}`}>{s.count}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center leading-tight mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Category filters ────────────────────────────────── */}
        <nav className="flex flex-wrap items-center gap-2" aria-label="Filter proposals by category">
          {["All", "Academic", "Facilities", "Policy"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                filter === cat
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/60 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat}
              {cat !== "All" && (
                <span className="ml-1.5 opacity-60">
                  {proposals.filter(p => p.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </nav>
>>>>>>> 260d440 (feat: improve Proposals page UX with modal detail view and layout fixes)
      </div>

      {/* ── Card Grid ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="columns-1 sm:columns-2 gap-4 space-y-0">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="mb-4 break-inside-avoid">
              <ProposalCardSkeleton />
            </div>
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={filter === "All" ? "No proposals yet" : `No ${filter.toLowerCase()} proposals`}
          description={filter === "All" ? "Be the first to submit a proposal for this channel and drive positive change." : `There are no proposals in the ${filter} category yet.`}
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-slate-900 dark:bg-slate-100 px-6 py-2.5 text-sm font-bold text-white dark:text-slate-900 shadow-lg transition-all hover:bg-slate-800 dark:hover:bg-slate-200"
            >
              Submit a Proposal
            </button>
          }
        />
      ) : (
        <div className="columns-1 sm:columns-2 gap-4">
          {filteredProposals.map(proposal => (
            <div key={proposal.id} className="mb-4 break-inside-avoid">
              <ProposalCard
                proposal={proposal}
                onVote={handleVote}
                userVote={userVotes[proposal.id]}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onStatusChange={handleStatusChange}
                onAddResponse={(id) => setRespondingProposalId(id)}
                onDelete={(id) => setDeletingProposalId(id)}
                onOpen={() => setSelectedProposal(proposal)}
              />
            </div>
          ))}
        </div>
      )}

      <CreateProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateProposal}
      />

      <ProposalDetailModal 
        isOpen={Boolean(selectedProposal)} 
        onClose={() => setSelectedProposal(null)} 
        proposal={proposals.find(p => p.id === selectedProposal?.id)} 
        onVote={handleVote}
        userVote={selectedProposal ? userVotes[selectedProposal.id] : undefined}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        onStatusChange={handleStatusChange}
        onAddResponse={(id) => setRespondingProposalId(id)}
        onDelete={(id) => setDeletingProposalId(id)}
      />


      {/* Modern Confirmation Modal for Delete */}
      {deletingProposalId && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Delete proposal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeletingProposalId(null);
          }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <h3 className="mb-2 text-lg font-black text-slate-900 dark:text-white">Delete Proposal?</h3>
            <p className="mb-6 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              This action cannot be undone. All votes and official responses associated with this proposal will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingProposalId(null)}
                className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProposal}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 hover:shadow-red-700/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modern Modal for Official Response */}
      {respondingProposalId && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Add official response"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setRespondingProposalId(null);
              setAdminResponseBody("");
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <h3 className="mb-2 text-lg font-black text-slate-900 dark:text-white">Add Official Response</h3>
            <p className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              Provide an official update or decision regarding this proposal. This will be visible to all students.
            </p>
            <textarea
              autoFocus
              value={adminResponseBody}
              onChange={(e) => setAdminResponseBody(e.target.value)}
              placeholder="Enter your official response..."
              className="mb-6 h-32 w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-sm font-medium outline-none transition-all focus:border-red-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-red-900/5 dark:focus:ring-red-400/5 dark:text-white"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setRespondingProposalId(null);
                  setAdminResponseBody("");
                }}
                className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button 
                disabled={!adminResponseBody.trim()}
                onClick={handleAddResponse}
                className="flex-1 rounded-xl bg-slate-900 dark:bg-slate-100 py-3 text-sm font-bold text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-black/20 transition-all hover:bg-slate-800 dark:hover:bg-slate-200 hover:shadow-slate-800/30 disabled:opacity-50"
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ProposalBoard;
