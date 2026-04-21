import { useState, useRef, useEffect } from "react";
import { MessageSquare, Minus, Plus } from "lucide-react";
import VoteWidget from "./VoteWidget";

function CommentItem({ comment, allComments, onReplySubmit, depth = 0 }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ref + measured height for smooth expand/collapse animation
  const childrenRef = useRef(null);
  const [childrenHeight, setChildrenHeight] = useState("auto");

  const authorName = comment.is_anonymous ? "Anonymous" : (comment.author_name || "User");
  const dateObj = new Date(comment.created_at);
  const timeAgo = !isNaN(dateObj) ? dateObj.toLocaleDateString() : "Just now";
  const score = comment.score ? parseInt(comment.score, 10) : 0;

  // Find children of this comment
  const childComments = allComments.filter((c) => c.parent_id === comment.id);
  const hasChildren = childComments.length > 0;

  // Count all descendants for collapsed summary
  const countDescendants = (parentId) => {
    const direct = allComments.filter((c) => c.parent_id === parentId);
    let total = direct.length;
    for (const child of direct) {
      total += countDescendants(child.id);
    }
    return total;
  };
  const descendantCount = hasChildren ? countDescendants(comment.id) : 0;

  // Measure children height for animation
  useEffect(() => {
    if (childrenRef.current) {
      setChildrenHeight(`${childrenRef.current.scrollHeight}px`);
    }
  }, [allComments, isReplying]);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    await onReplySubmit(comment.id, replyText, isAnonymous);
    setIsSubmitting(false);
    setReplyText("");
    setIsAnonymous(false);
    setIsReplying(false);
  };

  return (
    <div className="flex flex-col mt-3">
      <div className="flex gap-0 relative">
        {/* Collapse/Expand toggle + thread line */}
        <div className="flex flex-col items-center shrink-0 w-5 mr-1.5 sm:mr-2.5">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-200 shrink-0 ${
                isCollapsed
                  ? "border-slate-300 bg-slate-100 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                  : "border-slate-300 bg-white text-slate-500 hover:border-[#7f1d1d] hover:text-[#7f1d1d]"
              }`}
              aria-label={isCollapsed ? "Expand thread" : "Collapse thread"}
            >
              {isCollapsed ? <Plus size={11} strokeWidth={3} /> : <Minus size={11} strokeWidth={3} />}
            </button>
          ) : (
            <div className="w-5 h-5 shrink-0" />
          )}
          {/* Vertical thread line below the toggle */}
          {hasChildren && !isCollapsed && (
            <div className="flex-1 w-px bg-slate-200 mt-1 transition-colors duration-200" />
          )}
        </div>

        {/* Vote widget */}
        <VoteWidget
          itemId={comment.id}
          baseScore={score}
          tableName="forum_comment_votes"
          idColumn="comment_id"
        />

        {/* Comment body */}
        <div className="min-w-0 flex-1 ml-2 sm:ml-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
            <span className={comment.is_anonymous ? "font-semibold text-slate-600 bg-slate-100 px-1 rounded" : "font-semibold text-slate-700"}>
              {comment.is_anonymous ? "🙈 " : ""}{authorName}
            </span>
            <span className="text-slate-400">•</span>
            <span>{timeAgo}</span>
          </div>

          {/* Comment content — shown normally or truncated when collapsed */}
          <p className={`m-0 mt-1 text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-200 ${
            isCollapsed ? "text-slate-400" : "text-slate-800"
          }`}>
            {comment.content}
          </p>

          {/* Action bar */}
          <div className="mt-1.5 flex items-center gap-2 text-[12px] font-medium text-slate-500">
            <button
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <MessageSquare size={13} />
              <span>Reply</span>
            </button>
            {isCollapsed && descendantCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-slate-400 italic transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <span>+{descendantCount} {descendantCount === 1 ? "reply" : "replies"} hidden</span>
              </button>
            )}
          </div>

          {/* Reply form */}
          {isReplying && (
            <form onSubmit={handleSubmitReply} className="mt-3 bg-white p-3 rounded-[10px] border border-slate-200">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full resize-none rounded-[8px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
                required
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id={`anon-${comment.id}`}
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#7f1d1d] focus:ring-[#7f1d1d]"
                  />
                  <label htmlFor={`anon-${comment.id}`} className="text-xs text-slate-600 cursor-pointer">
                    Post Anonymously
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReplying(false)}
                    className="rounded-[8px] px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-[8px] bg-[#7f1d1d] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:opacity-70"
                  >
                    {isSubmitting ? "Posting..." : "Reply"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Children — animated collapse/expand */}
          {hasChildren && (
            <div
              ref={childrenRef}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isCollapsed ? "0px" : childrenHeight,
                opacity: isCollapsed ? 0 : 1,
              }}
            >
              <div className="mt-1">
                {childComments.map((child) => (
                  <CommentItem
                    key={child.id}
                    comment={child}
                    allComments={allComments}
                    onReplySubmit={onReplySubmit}
                    depth={depth + 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
