import { Flame, Sparkles, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ForumThread from "./ForumThread";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";

const filters = [
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New", icon: Sparkles },
];

function ForumBoard({ channelId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("hot");
  const [searchQuery, setSearchQuery] = useState("");
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
  }, [activeFilter, channelId, fetchPosts]);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section className="space-y-3" aria-label="Forum board">
      <div className="soft-enter flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={14} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full sm:max-w-[260px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within channel..."
            className="w-full rounded-[12px] border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
          />
        </label>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Loading threads...
          </div>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No discussions in this channel yet. Be the first to start one!
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((item) => (
            <ForumThread key={item.id} item={item} isAdmin={isAdmin} />
          ))
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            No discussions match your search.
          </div>
        )}
      </div>
    </section>
  );
}

export default ForumBoard;
