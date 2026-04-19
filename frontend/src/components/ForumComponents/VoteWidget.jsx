import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function VoteWidget({ postId, baseScore = 0 }) {
  const [vote, setVote] = useState(0);

  const handleVote = async (nextVote) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert("You must be logged in to vote.");
        return;
      }

      const newVote = vote === nextVote ? 0 : nextVote;

      // Optimistic update
      setVote(newVote);

      if (newVote === 0) {
        // Remove vote
        await supabase
          .from("forum_votes")
          .delete()
          .match({ post_id: postId, user_id: userData.user.id });
      } else {
        // Upsert vote
        await supabase
          .from("forum_votes")
          .upsert({
            post_id: postId,
            user_id: userData.user.id,
            vote_value: newVote
          });
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to register vote");
    }
  };

  // We are calculating the visible score as:
  // The sum of all votes from the database (baseScore), MINUS our original vote (which is captured in baseScore if we already voted), PLUS our new vote.
  // Since we aren't fetching the initial `vote` state from the DB in this component yet, 
  // we'll just add our local `vote` to the `baseScore`. It's a simple approximation for the hackathon.
  const displayScore = baseScore + vote;

  return (
    <div className="flex w-10 flex-col items-center gap-1.5 rounded-[10px] border border-slate-200 bg-slate-50 px-1 py-2">
      <button
        type="button"
        onClick={() => handleVote(1)}
        className={`rounded p-0.5 transition-colors ${vote === 1
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
        className={`rounded p-0.5 transition-colors ${vote === -1
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
