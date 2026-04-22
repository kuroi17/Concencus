import { ArrowDown, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

function VoteWidget({
  itemId,
  baseScore = 0,
  tableName = "forum_votes",
  idColumn = "post_id"
}) {
  const [vote, setVote] = useState(0);
  const [voteLoaded, setVoteLoaded] = useState(false);
  const [scoreOffset, setScoreOffset] = useState(0);
  const [isVoting, setIsVoting] = useState(false);

  // Fetch the current user's vote from the database on mount / itemId change
  useEffect(() => {
    let isMounted = true;
    setVote(0);
    setVoteLoaded(false);

    const fetchVote = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user || !isMounted) {
        if (isMounted) setVoteLoaded(true);
        return;
      }

      const { data } = await supabase
        .from(tableName)
        .select("vote_value")
        .eq(idColumn, itemId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (isMounted) {
        if (data) setVote(data.vote_value);
        setVoteLoaded(true);
      }
    };

    fetchVote();
    return () => { isMounted = false; };
  }, [itemId, tableName, idColumn]);

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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert("You must be logged in to vote.");
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
        await supabase
          .from(tableName)
          .delete()
          .match({ [idColumn]: itemId, user_id: userData.user.id });
      } else {
        // Upsert handles switching from upvote → downvote atomically
        await supabase
          .from(tableName)
          .upsert({
            [idColumn]: itemId,
            user_id: userData.user.id,
            vote_value: newVote,
          });
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const displayScore = baseScore + scoreOffset;

  const scoreColor =
    vote === 1 ? "text-[#7f1d1d]"
    : vote === -1 ? "text-slate-600"
    : "text-slate-700";

  return (
    <div className={`flex w-10 flex-col items-center gap-1 rounded-[10px] border px-1 py-2 shrink-0 transition-colors duration-150 ${
      vote === 1 ? "border-[#7f1d1d]/20 bg-[#7f1d1d]/5"
      : vote === -1 ? "border-slate-300 bg-slate-100"
      : "border-slate-200 bg-slate-50"
    }`}>
      {/* Upvote */}
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={isVoting || !voteLoaded}
        className={`rounded p-0.5 transition-colors disabled:opacity-40 ${
          vote === 1
            ? "text-[#7f1d1d]"
            : "text-slate-400 hover:text-[#7f1d1d]"
        }`}
        aria-label="Upvote"
      >
        <ArrowUp size={16} strokeWidth={vote === 1 ? 3 : 2} />
      </button>

      {/* Score */}
      <span className={`text-[12px] font-bold tabular-nums transition-colors ${scoreColor}`}>
        {displayScore}
      </span>

      {/* Downvote */}
      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={isVoting || !voteLoaded}
        className={`rounded p-0.5 transition-colors disabled:opacity-40 ${
          vote === -1
            ? "text-slate-600"
            : "text-slate-400 hover:text-slate-600"
        }`}
        aria-label="Downvote"
      >
        <ArrowDown size={16} strokeWidth={vote === -1 ? 3 : 2} />
      </button>
    </div>
  );
}

export default VoteWidget;
