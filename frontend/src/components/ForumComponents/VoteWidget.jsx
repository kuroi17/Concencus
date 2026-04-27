import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../context/UserContext";
import toast from "react-hot-toast";

function VoteWidget({
  itemId,
  baseScore = 0,
  tableName = "forum_votes",
  idColumn = "post_id"
}) {
  const { user: currentUser } = useUser();
  const [vote, setVote] = useState(0);
  const [voteLoaded, setVoteLoaded] = useState(false);
  const [scoreOffset, setScoreOffset] = useState(0);
  const [isVoting, setIsVoting] = useState(false);

  // Fetch the current user's vote from the database on mount / itemId change
  useEffect(() => {
    if (!currentUser?.id) {
      setVote(0);
      setVoteLoaded(true);
      return;
    }

    let isMounted = true;
    const fetchVote = async () => {
      const { data } = await supabase
        .from(tableName)
        .select("vote_value")
        .eq(idColumn, itemId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (isMounted) {
        if (data) setVote(data.vote_value);
        else setVote(0);
        setVoteLoaded(true);
      }
    };

    fetchVote();
    return () => { isMounted = false; };
  }, [itemId, tableName, idColumn, currentUser?.id]);

  const [prevBaseScore, setPrevBaseScore] = useState(baseScore);

  // When the server sends an updated score via realtime, reset the optimistic offset.
  // The new baseScore already reflects the DB state, so we no longer need the offset.
  if (baseScore !== prevBaseScore) {
    setPrevBaseScore(baseScore);
    setScoreOffset(0);
  }

  const handleVote = async (nextVote) => {
    if (isVoting || !voteLoaded) return;
    try {
      if (!currentUser) {
        toast.error("You must be logged in to vote.");
        return;
      }

      // Clicking the same direction toggles it off
      const newVote = vote === nextVote ? 0 : nextVote;
      const offsetChange = newVote - vote;

      // Optimistic update
      setVote(newVote);
      setScoreOffset((prev) => prev + offsetChange);
      setIsVoting(true);

      if (newVote === 0) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .match({ [idColumn]: itemId, user_id: currentUser.id });
        if (error) throw error;
      } else {
        // Upsert handles switching from upvote → downvote atomically
        const { error } = await supabase
          .from(tableName)
          .upsert({
            [idColumn]: itemId,
            user_id: currentUser.id,
            vote_value: newVote,
          });
        if (error) throw error;
      }
    } catch {
      toast.error("Failed to save vote.");
      setVote(vote);
      setScoreOffset(scoreOffset);
    } finally {
      setIsVoting(false);
    }
  };

  const displayScore = baseScore + scoreOffset;

  return (
    <div className="flex w-12 flex-col items-center gap-1 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-3 shrink-0 transition-all">
      {/* Upvote */}
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={!voteLoaded}
        className={`rounded-lg p-1 transition-all disabled:opacity-40 ${
          vote === 1
            ? "text-red-600 bg-red-100 dark:bg-red-900/30"
            : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
        }`}
        aria-label="Upvote"
      >
        <ArrowBigUp size={24} fill={vote === 1 ? "currentColor" : "none"} />
      </button>

      {/* Score */}
      <span className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
        {displayScore}
      </span>

      {/* Downvote */}
      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={!voteLoaded}
        className={`rounded-lg p-1 transition-all disabled:opacity-40 ${
          vote === -1
            ? "text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700"
            : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        aria-label="Downvote"
      >
        <ArrowBigDown size={24} fill={vote === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export default VoteWidget;
