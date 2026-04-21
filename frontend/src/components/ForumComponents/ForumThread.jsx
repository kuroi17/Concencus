import {
  Bookmark,
  Flag,
  MessageSquare,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import VoteWidget from "./VoteWidget";
import CommentSection from "./CommentSection";
import { supabase } from "../../lib/supabaseClient";
import { useEscapeKey } from "../../hooks/useEscapeKey";

function ForumThread({ item, isAdmin = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const authorName = item.is_anonymous ? "Anonymous" : (item.author_name || "User");
  const dateObj = new Date(item.created_at);
  const timeAgo = !isNaN(dateObj) ? dateObj.toLocaleDateString() : "Just now";

  // Convert score from big query safely
  const score = item.score ? parseInt(item.score, 10) : 0;
  const comments = item.comment_count ? parseInt(item.comment_count, 10) : 0;

  useEscapeKey(isMenuOpen, () => setIsMenuOpen(false));

  return (
    <div className="flex flex-col gap-2">
      <article
        className="soft-enter group relative flex gap-2.5 rounded-[14px] border border-slate-200/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300 sm:gap-3 sm:px-4 sm:py-4"
        onMouseLeave={() => setIsMenuOpen(false)}
      >
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

          {item.image_url && (
            <div className="mt-3 overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50">
              <img
                src={item.image_url}
                alt=""
                className="max-h-[340px] w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

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

        <div className="absolute right-3 top-3">
          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className="inline-flex items-center justify-center rounded-[10px] p-2 text-slate-500 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100"
              aria-label="More actions"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
                role="menu"
              >
                {isAdmin && (
                  <button
                    type="button"
                    onClick={async (event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      const confirmed = window.confirm(
                        "Delete this discussion? This cannot be undone.",
                      );
                      if (!confirmed) return;

                      const { error } = await supabase
                        .from("forum_posts")
                        .delete()
                        .eq("id", item.id);

                      if (error) {
                        alert(error.message || "Failed to delete post.");
                        return;
                      }
                      alert("Discussion deleted.");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                    role="menuitem"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsMenuOpen(false);
                    const reason = window.prompt(
                      "Why are you reporting this post? (optional)",
                      "",
                    );

                    queueMicrotask(async () => {
                      const { data: authData, error: authError } =
                        await supabase.auth.getUser();
                      if (authError || !authData?.user) {
                        alert("You must be logged in to report.");
                        return;
                      }

                      const { error } = await supabase
                        .from("forum_reports")
                        .insert([
                          {
                            post_id: item.id,
                            reporter_id: authData.user.id,
                            reason: reason?.trim() || null,
                          },
                        ]);

                      if (error) {
                        alert(error.message || "Failed to submit report.");
                        return;
                      }

                      alert("Report submitted. Thanks for helping keep the community safe.");
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  role="menuitem"
                >
                  <Flag size={16} />
                  Report
                </button>
              </div>
            )}
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
