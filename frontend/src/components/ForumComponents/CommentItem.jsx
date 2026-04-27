import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

function timeAgoStr(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "just now";
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function nameToColor(name) {
  const colors = ["#7f1d1d","#1d4ed8","#15803d","#92400e","#5b21b6","#0e7490","#be185d","#374151"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ name, avatarUrl, size = 28 }) {
  const initial = name ? name[0].toUpperCase() : "?";
  const bg = nameToColor(name || "?");
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.42 }}>
      {initial}
    </div>
  );
}

function InlineVotes({ itemId, baseScore }) {
  const [vote, setVote] = useState(0);
  const [offset, setOffset] = useState(0);
  const [prevBase, setPrevBase] = useState(baseScore);
  const [isVoting, setIsVoting] = useState(false);

  // When the server sends a new baseScore (via realtime), reset the optimistic
  // offset — the server score already includes the user's vote.
  if (baseScore !== prevBase) {
    setPrevBase(baseScore);
    setOffset(0);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const { data } = await supabase
        .from("forum_comment_votes").select("vote_value")
        .eq("comment_id", itemId).eq("user_id", user.id).maybeSingle();
      if (mounted && data) setVote(data.vote_value);
    })();
    return () => { mounted = false; };
  }, [itemId]);

  const handleVote = async (next) => {
    if (isVoting) return; // prevent rapid double-clicks
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newVote = vote === next ? 0 : next;
    const change = newVote - vote;
    // Optimistic update
    setVote(newVote);
    setOffset(o => o + change);
    setIsVoting(true);
    try {
      if (newVote === 0) {
        await supabase.from("forum_comment_votes").delete().match({ comment_id: itemId, user_id: user.id });
      } else {
        await supabase.from("forum_comment_votes").upsert({ comment_id: itemId, user_id: user.id, vote_value: newVote });
      }
    } finally {
      setIsVoting(false);
    }
  };

  const display = baseScore + offset;
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" onClick={() => handleVote(1)} aria-label="Upvote"
        className={`rounded p-0.5 transition-colors ${vote === 1 ? "text-[#7f1d1d] dark:text-red-400" : "text-slate-400 hover:text-[#7f1d1d] dark:hover:text-red-400"}`}>
        <ArrowUp size={13} strokeWidth={2.5} />
      </button>
      <span className={`text-xs font-semibold min-w-[1.5ch] text-center ${vote === 1 ? "text-[#7f1d1d] dark:text-red-400" : vote === -1 ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
        {display}
      </span>
      <button type="button" onClick={() => handleVote(-1)} aria-label="Downvote"
        className={`rounded p-0.5 transition-colors ${vote === -1 ? "text-slate-600 dark:text-slate-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
        <ArrowDown size={13} strokeWidth={2.5} />
      </button>
    </span>
  );
}



const AVATAR_SIZE = 28;
const THREAD_GAP = 10;
const MAX_INDENT_DEPTH = 4;

function CommentItem({ comment, allComments, onReplySubmit, depth = 0 }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const authorName = comment.is_anonymous ? "Anonymous" : (comment.author_name || "User");
  const avatarUrl = comment.is_anonymous ? null : (comment.avatar_url || null);
  const timeStr = timeAgoStr(comment.created_at);
  const score = comment.score ? parseInt(comment.score, 10) : 0;

  const childComments = allComments.filter((c) => c.parent_id === comment.id);
  const hasChildren = childComments.length > 0;

  const countDescendants = (parentId) => {
    const direct = allComments.filter((c) => c.parent_id === parentId);
    return direct.reduce((acc, child) => acc + 1 + countDescendants(child.id), 0);
  };
  const descendantCount = hasChildren ? countDescendants(comment.id) : 0;

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

  // At max indent depth, stop adding avatar-width indentation and show a border instead
  const atMaxDepth = depth >= MAX_INDENT_DEPTH;

  return (
    <div
      className={depth === 0 ? "mt-4 first:mt-0" : "mt-3"}
      style={atMaxDepth ? { borderLeft: "2px solid #e2e8f0", paddingLeft: 8 } : undefined}
    >
      <div className="flex" style={{ gap: THREAD_GAP }}>
        {/* Left: avatar + clickable thread line */}
        {!atMaxDepth && (
          <div className="flex flex-col items-center shrink-0" style={{ width: AVATAR_SIZE }}>
            <Avatar name={authorName} avatarUrl={avatarUrl} size={AVATAR_SIZE} />
            {hasChildren && !isCollapsed && (
              <div
                className="flex-1 mt-1 rounded-full cursor-pointer transition-colors bg-slate-200 dark:bg-slate-800 hover:bg-[#7f1d1d] dark:hover:bg-red-500"
                style={{ width: 2, minHeight: 12 }}
                onClick={() => setIsCollapsed(true)}
                title="Collapse thread"
              />
            )}
          </div>
        )}

        {/* Right: all content */}
        <div className="flex-1 min-w-0">
          {/* Author + date */}
          <div className="flex items-center gap-1.5 text-xs leading-none mb-1.5">
            {atMaxDepth && (
              <Avatar name={authorName} avatarUrl={avatarUrl} size={18} />
            )}
            <span className={`font-semibold ${comment.is_anonymous ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>
              {comment.is_anonymous ? "🙈 Anonymous" : authorName}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-400 dark:text-slate-500">{timeStr}</span>
          </div>

          {isCollapsed ? (
            <button type="button" onClick={() => setIsCollapsed(false)}
              className="text-xs text-slate-400 dark:text-slate-500 italic hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              [{descendantCount + 1} {descendantCount + 1 === 1 ? "comment" : "comments"} collapsed] — click to expand
            </button>
          ) : (
            <>
              {/* Content */}
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Action bar */}
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <button type="button" onClick={() => setIsCollapsed(true)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-base leading-none font-mono"
                  title="Collapse" aria-label="Collapse thread">⊖</button>

                <InlineVotes itemId={comment.id} baseScore={score} />

                <button type="button" onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 font-medium hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                  <MessageSquare size={13} strokeWidth={2} />
                  Reply
                </button>
              </div>

              {/* Reply form — always outside collapse so it's never clipped */}
              {isReplying && (
                <form onSubmit={handleSubmitReply}
                  className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] p-3 shadow-sm">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${authorName}…`}
                    rows={3}
                    autoFocus
                    className="w-full resize-none rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-[#7f1d1d] dark:focus:border-red-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    required
                  />
                  <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                      <input type="checkbox" checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-3 w-3 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
                      Post anonymously
                    </label>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => { setIsReplying(false); setReplyText(""); }}
                        className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={isSubmitting}
                        className="px-3 py-1 rounded-[6px] bg-[#7f1d1d] text-xs font-semibold text-white hover:bg-[#991b1b] disabled:opacity-60 transition-colors">
                        {isSubmitting ? "Posting…" : "Reply"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Children — no maxHeight trick needed; thread line stretches naturally */}
              {hasChildren && (
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
