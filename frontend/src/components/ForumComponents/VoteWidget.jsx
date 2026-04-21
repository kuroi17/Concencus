import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

function VoteWidget({ 
  itemId, 
  baseScore = 0, 
  tableName = "forum_votes", 
  idColumn = "post_id" 
}) {
  const [vote, setVote] = useState(0);
  const [scoreOffset, setScoreOffset] = useState(0);

  // Fetch the current user's actual vote from the database on mount
  useEffect(() => {
    let isMounted = true;
    const fetchVote = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user || !isMounted) return;

      const { data } = await supabase
        .from(tableName)
        .select("vote_value")
        .eq(idColumn, itemId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (isMounted && data) {
        setVote(data.vote_value);
      }
    };

    fetchVote();

    return () => {
      isMounted = false;
    };
  }, [itemId, tableName, idColumn]);

  const [prevBaseScore, setPrevBaseScore] = useState(baseScore);

  // Reset our optimistic offset when baseScore updates from the realtime server
  // by adjusting state during render, avoiding an extra useEffect cascading render.
  if (baseScore !== prevBaseScore) {
    setPrevBaseScore(baseScore);
    setScoreOffset(0);
  }

  const handleVote = async (nextVote) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert("You must be logged in to vote.");
        return;
      }

      const newVote = vote === nextVote ? 0 : nextVote;
      const offsetChange = newVote - vote;

      // Optimistic update
      setVote(newVote);
      setScoreOffset((prev) => prev + offsetChange);

      if (newVote === 0) {
        // Remove vote
        await supabase
          .from(tableName)
          .delete()
          .match({ [idColumn]: itemId, user_id: userData.user.id });
      } else {
        // Upsert vote (overwrites any existing vote for this user and item)
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
      alert("Failed to register vote");
    }
  };

  const displayScore = baseScore + scoreOffset;

  return (
    <div className="flex w-10 flex-col items-center gap-1.5 rounded-[10px] border border-slate-200 bg-slate-50 px-1 py-2 shrink-0">
      <button
        type="button"
        onClick={() => handleVote(1)}
        className={`rounded p-0.5 transition-colors ${
          vote === 1
            ? "text-[#7f1d1d]"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }`}
        aria-label="Upvote"
      >
        <ChevronUp size={17} />
      </button>

      <span className="text-[12px] font-semibold text-slate-800">
        {displayScore}
      </span>

      <button
        type="button"
        onClick={() => handleVote(-1)}
        className={`rounded p-0.5 transition-colors ${
          vote === -1
            ? "text-[#7f1d1d]"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }`}
        aria-label="Downvote"
      >
        <ChevronDown size={17} />
      </button>
    </div>
  );
}

export default VoteWidget;
