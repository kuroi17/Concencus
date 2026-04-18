import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function VoteWidget({ baseScore = 0 }) {
  const [vote, setVote] = useState(0);

  const handleVote = (nextVote) => {
    setVote((current) => (current === nextVote ? 0 : nextVote));
  };

  return (
    <div className="flex w-10 flex-col items-center gap-1.5 rounded-[10px] border border-slate-200 bg-slate-50 px-1 py-2">
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
        {baseScore + vote}
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
