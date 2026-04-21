import { MessageSquare, Share2, Bookmark } from "lucide-react";
import { useState } from "react";
import VoteWidget from "./VoteWidget";
import CommentSection from "./CommentSection";

function ForumThread({ item }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const authorName = item.is_anonymous ? "Anonymous" : (item.author_name || "User");
  const dateObj = new Date(item.created_at);
  const timeAgo = !isNaN(dateObj) ? dateObj.toLocaleDateString() : "Just now";

  // Convert score from big query safely
  const score = item.score ? parseInt(item.score, 10) : 0;
  const comments = item.comment_count ? parseInt(item.comment_count, 10) : 0;

  return (
    <div className="flex flex-col gap-2">
      <article className="soft-enter flex gap-2.5 rounded-[14px] border border-slate-200/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300 sm:gap-3 sm:px-4 sm:py-4">
        <VoteWidget itemId={item.id} baseScore={score} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
            <span className={item.is_anonymous ? "font-semibold text-slate-600 bg-slate-100 px-1 rounded" : ""}>
              {item.is_anonymous ? "🙈 " : ""}Posted by {authorName}
            </span>
            <span className="text-slate-400">•</span>
            <span>{timeAgo}</span>
            <span className="inline-flex rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 text-[11px] font-medium">
              {item.tag || "General"}
            </span>
          </div>

          <h3 className="m-0 mt-2 text-[1.07rem] font-semibold leading-snug text-slate-900 sm:text-[1.25rem]">
            {item.title}
          </h3>

          <p className="m-0 mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {item.excerpt}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors ${
                isExpanded ? "bg-slate-200 text-slate-900" : "hover:bg-slate-100"
              }`}
            >
              <MessageSquare size={14} />
              <span>{comments} Comments</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-slate-100"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-slate-100"
            >
              <Bookmark size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </article>

      {isExpanded && (
        <div className="ml-0 sm:ml-12 soft-enter">
          <CommentSection postId={item.id} />
        </div>
      )}
    </div>
  );
}

export default ForumThread;
