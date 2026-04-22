import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import CommentItem from "./CommentItem";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();

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
        alert("You must be logged in to comment.");
        return;
      }

      const { error } = await supabase.from("forum_comments").insert([
        {
          post_id: postId,
          author_id: userData.user.id,
          parent_id: parentId,
          content: content,
          is_anonymous: isAnon,
        },
      ]);

      if (error) throw error;
    } catch (err) {
      console.error("Error creating comment:", err);
      alert("Failed to create comment. Check console.");
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
    return <div className="py-4 text-center text-sm text-slate-500">Loading comments...</div>;
  }

  return (
    <section className="bg-slate-50 rounded-[14px] border border-slate-200/80 p-3 sm:p-4 mt-2">
      <form onSubmit={handleRootSubmit} className="mb-6 bg-white p-3 rounded-[12px] border border-slate-200 shadow-sm">
        <textarea
          value={rootReplyText}
          onChange={(e) => setRootReplyText(e.target.value)}
          placeholder="Add a comment to this discussion..."
          rows={3}
          className="w-full resize-none rounded-[8px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
          required
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              id={`anon-root-${postId}`}
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#7f1d1d] focus:ring-[#7f1d1d]"
            />
            <label htmlFor={`anon-root-${postId}`} className="text-sm text-slate-600 cursor-pointer">
              Post Anonymously
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[10px] bg-[#7f1d1d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:opacity-70"
          >
            {isSubmitting ? "Posting..." : "Comment"}
          </button>
        </div>
      </form>

      {rootComments.length === 0 ? (
        <div className="py-4 text-center text-sm text-slate-500">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-2">
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
