import { useState, useEffect } from "react";
import { Plus, LayoutGrid } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ProposalCard from "./ProposalCard";
import CreateProposalModal from "./CreateProposalModal";
import toast from "react-hot-toast";
import { ProposalCardSkeleton } from "../../common/Skeleton";
import { EmptyState } from "../../common/EmptyState";

function ProposalBoard({ channelId, isAdmin, socket }) {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [userVotes, setUserVotes] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const loadProposals = async () => {
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

    if (socket && channelId) {
      socket.emit("proposals:join_channel", { channelId });

      socket.on("proposal:vote_update", (data) => {
        setProposals(prev => prev.map(p => 
          p.id === data.proposalId 
            ? { ...p, upvotes_count: data.upvotes, downvotes_count: data.downvotes }
            : p
        ));
      });

      socket.on("proposal:status_changed", (data) => {
        setProposals(prev => prev.map(p => 
          p.id === data.proposalId ? { ...p, status: data.status } : p
        ));
      });

      socket.on("proposal:response_added", (data) => {
        setProposals(prev => prev.map(p => 
          p.id === data.proposalId 
            ? { ...p, responses: [...(p.responses || []), data.response] }
            : p
        ));
      });

      return () => {
        socket.off("proposal:vote_update");
        socket.off("proposal:status_changed");
        socket.off("proposal:response_added");
      };
    }
  }, [channelId, socket]);

  const handleCreateProposal = async (proposalData) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      toast.error("Please log in to submit a proposal.");
      return false;
    }

    const { title, description, category, sdgTags, isAnonymous } = proposalData;

    try {
      // 1. Insert proposal base data
      const { data: insertedProposal, error: insertError } = await supabase
        .from("proposals")
        .insert([{
          title,
          description,
          category,
          sdg_tags: sdgTags || [],
          is_anonymous: !!isAnonymous,
          author_id: user.id,
          channel_id: channelId
        }])
        .select(`
          *,
          author:user_profiles!author_id(full_name, avatar_url)
        `)
        .single();

      if (insertError) {
        console.error("Database Error:", insertError);
        toast.error(`Post failed: ${insertError.message}`);
        return false;
      }

    
      const formatted = {
        ...insertedProposal,
        author_name: insertedProposal.author?.full_name,
        author_avatar: insertedProposal.author?.avatar_url,
        responses: []
      };
      setProposals([formatted, ...proposals]);
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
    const prevProposals = [...proposals];
    const prevUserVotes = { ...userVotes };

    // ── Optimistic Update ─────────────────────────────────────────
    let upDelta = 0;
    let downDelta = 0;

    if (currentVote === voteType) {
      // Removing vote
      if (voteType === 1) upDelta = -1;
      else downDelta = -1;
      setUserVotes(prev => { const n = { ...prev }; delete n[proposalId]; return n; });
    } else {
      // Changing or adding vote
      if (voteType === 1) {
        upDelta = 1;
        if (currentVote === -1) downDelta = -1;
      } else {
        downDelta = 1;
        if (currentVote === 1) upDelta = -1;
      }
      setUserVotes(prev => ({ ...prev, [proposalId]: voteType }));
    }

    setProposals(prev => prev.map(p => 
      p.id === proposalId 
        ? { ...p, upvotes_count: p.upvotes_count + upDelta, downvotes_count: p.downvotes_count + downDelta }
        : p
    ));

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
      // Revert on error
      setProposals(prevProposals);
      setUserVotes(prevUserVotes);
      toast.error("Failed to sync vote: " + (err.message || "Unknown error"));
    }
  };

  const handleStatusChange = async (proposalId, nextStatus) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: nextStatus })
      .eq("id", proposalId);

    if (!error && socket) {
      socket.emit("proposal:status_update", { proposalId, channelId, status: nextStatus });
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
    
    const { data, error } = await supabase
      .from("proposal_responses")
      .insert([{
        proposal_id: respondingProposalId,
        admin_id: user.id,
        body: adminResponseBody.trim()
      }])
      .select(`
        *,
        admin:user_profiles!admin_id(full_name)
      `)
      .single();

    if (!error && socket) {
      const response = { ...data, admin_name: data.admin?.full_name };
      socket.emit("proposal:new_response", { proposalId: respondingProposalId, channelId, response });
      toast.success("Response added");
      setRespondingProposalId(null);
      setAdminResponseBody("");
    } else if (error) {
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
      setProposals(prev => prev.filter(p => p.id !== deletingProposalId));
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

  return (
    <div className="space-y-6">
      <div className="mb-8 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="m-0 text-lg font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Proposals
          </h2>

          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#800000] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0 disabled:opacity-70"
            >
              <Plus size={16} />
              <span>Create Proposal</span>
            </button>
          </div>
        </header>

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
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <ProposalCardSkeleton key={i} />
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
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredProposals.map(proposal => (
            <ProposalCard 
              key={proposal.id} 
              proposal={proposal} 
              onVote={handleVote}
              userVote={userVotes[proposal.id]}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onStatusChange={handleStatusChange}
              onAddResponse={(id) => setRespondingProposalId(id)}
              onDelete={(id) => setDeletingProposalId(id)}
            />
          ))}
        </div>
      )}

      <CreateProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateProposal}
      />

      {/* Modern Confirmation Modal for Delete */}
      {deletingProposalId && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
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
        </div>
      )}

      {/* Modern Modal for Official Response */}
      {respondingProposalId && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
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
        </div>
      )}
    </div>
  );
}

export default ProposalBoard;
