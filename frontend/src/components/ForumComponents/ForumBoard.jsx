import { Flame, Sparkles, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import ForumThread from "./ForumThread";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import { PostCardSkeleton } from "../../common/Skeleton";
import { EmptyState } from "../../common/EmptyState";
import { MessageSquarePlus, SearchX } from "lucide-react";

const filters = [
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New", icon: Sparkles },
];

function ForumBoard({ channelId, refreshKey = 0 }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const [expandedPostId, setExpandedPostId] = useState(searchParams.get("post") || null);
  const { isAdmin } = useCurrentUserProfile();

  const fetchPosts = useCallback(async () => {
    if (!channelId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let query = supabase
      .from("forum_posts_view")
      .select("*")
      .eq("channel_id", channelId); // ← filter by selected channel

    if (activeFilter === "hot") {
      query = query
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data) {
      setPosts(data);
    } else if (error) {
      console.error("ForumBoard fetch error:", error);
    }
    setLoading(false);
  }, [activeFilter, channelId]);

  // Re-fetch whenever channel or filter changes
  useEffect(() => {
    queueMicrotask(() => {
      setPosts([]); // clear stale posts instantly on channel switch
      fetchPosts();
    });

    const subscription = supabase
      .channel(`forum_updates_${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_posts" },
        fetchPosts,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_votes" },
        fetchPosts,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeFilter, channelId, refreshKey, fetchPosts]);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section className="space-y-3" aria-label="Forum board">
      <div className="soft-enter flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 p-1 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm shadow-slate-200 dark:shadow-black"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#800000] dark:text-red-400" : ""} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full sm:max-w-[280px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-[#800000] dark:focus:border-red-400 focus:ring-4 focus:ring-red-500/5 dark:focus:ring-red-400/5"
          />
        </label>
      </div>

      <div className="space-y-3">
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState 
            icon={MessageSquarePlus}
            title="No discussions yet"
            description="Be the first to start a discussion in this channel!"
          />
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((item) => (
            <ForumThread
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              isExpanded={expandedPostId === item.id}
              onToggleExpand={() => setExpandedPostId(expandedPostId === item.id ? null : item.id)}
            />
          ))
        ) : (
          <EmptyState 
            icon={SearchX}
            title="No results found"
            description="We couldn't find any discussions matching your search."
          />
        )}
      </div>
    </section>
  );
}

export default ForumBoard;
