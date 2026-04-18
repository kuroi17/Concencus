import { MessageSquare, Share2, Bookmark } from "lucide-react";
import VoteWidget from "./VoteWidget";

function ForumThread({ item }) {
  return (
    <article className="soft-enter flex gap-3 rounded-[14px] border border-slate-200/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300 sm:px-4 sm:py-4">
      <VoteWidget baseScore={item.score} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
          <span>Posted by {item.author}</span>
          <span className="text-slate-400">•</span>
          <span>{item.timeAgo}</span>
          <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
            {item.channel}
          </span>
        </div>

        <h3 className="m-0 mt-2 text-[1.25rem] font-semibold leading-snug text-slate-900">
          {item.title}
        </h3>

        <p className="m-0 mt-2 text-sm leading-relaxed text-slate-700">
          {item.excerpt}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-600">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-slate-100"
          >
            <MessageSquare size={14} />
            <span>{item.comments} Comments</span>
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
  );
}

export default ForumThread;
