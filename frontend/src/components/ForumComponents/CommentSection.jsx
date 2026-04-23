import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import CommentItem from "./CommentItem";
import toast from "react-hot-toast";

function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rootReplyText, setRootReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    
    // We don't want to set loading to true on every realtime update to avoid flickering
    const { data, error } = await supabase
      .from("forum_comments_view")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchComments();
    });

    const subscription = supabase
      .channel(`forum_comments_${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_comments", filter: `post_id=eq.${postId}` }, fetchComments)
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_comment_votes" }, fetchComments)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId, fetchComments]);

  const handleSubmitComment = async (parentId, content, isAnon) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to comment.");
        return;
      }

      const { error: insertError } = await supabase.from("forum_comments").insert([
        {
          post_id: postId,
          author_id: userData.user.id,
          parent_id: parentId,
          content: content,
          is_anonymous: isAnon,
        },
      ]);

      if (insertError) {
        console.error("Comment error:", insertError);
        toast.error("Failed to create comment.");
      } else {
        toast.success("Comment added!");
      }
    } catch (err) {
      console.error("Error creating comment:", err);
      toast.error("Failed to create comment. Check console.");
    }
  };

  const handleRootSubmit = async (e) => {
    e.preventDefault();
    if (!rootReplyText.trim()) return;

    setIsSubmitting(true);
    await handleSubmitComment(null, rootReplyText, isAnonymous);
    setIsSubmitting(false);
    setRootReplyText("");
    setIsAnonymous(false);
  };

  // Extract only top-level comments (parent_id is null)
  const rootComments = comments.filter((c) => !c.parent_id);

  if (loading) {
    return <div className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">Loading comments...</div>;
  }

  return (
    <section className="bg-slate-50 dark:bg-slate-800/50 rounded-[12px] border border-slate-200/80 dark:border-slate-800 p-4 mt-3">
      <form onSubmit={handleRootSubmit} className="mb-5 bg-white dark:bg-slate-900 p-3 rounded-[10px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Add a comment</p>
        <textarea
          value={rootReplyText}
          onChange={(e) => setRootReplyText(e.target.value)}
          placeholder="What are your thoughts?"
          rows={3}
          className="w-full resize-none rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-[#7f1d1d] dark:focus:border-red-400 focus:bg-white dark:focus:bg-slate-800"
          required
        />
        <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-3 w-3 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#7f1d1d]"
            />
            Post anonymously
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[8px] bg-[#7f1d1d] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:opacity-70"
          >
            {isSubmitting ? "Posting…" : "Comment"}
          </button>
        </div>
      </form>

      {rootComments.length === 0 ? (
        <div className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div>
          {rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={comments}
              onReplySubmit={handleSubmitComment}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default CommentSection;
