import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import AnnouncementCard from "./AnnouncementCard";

function AnnouncementBoard({ channelId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    if (!channelId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("channel_id", channelId) // ← filter by selected channel
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    } else if (error) {
      console.error("AnnouncementBoard fetch error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    setAnnouncements([]); // clear stale items on channel switch
    fetchAnnouncements();

    // Realtime: re-fetch if any announcement is inserted/updated/deleted
    const subscription = supabase
      .channel(`announcements_${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        fetchAnnouncements,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId]);

  return (
    <section className="soft-enter pb-2" aria-label="Announcement board">
      {/* ── Board header ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold text-slate-900 sm:text-lg">
          Announcement Board
        </h2>

        {/* Post Announcement — static / admin-only for now */}
        <button
          type="button"
          disabled
          title="Only administrators can post announcements"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-[12px] bg-[#7f1d1d] px-4 py-2 text-sm font-semibold text-white opacity-60 transition-opacity hover:opacity-70"
          aria-label="Post Announcement (admin only)"
        >
          <Megaphone size={15} />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        /* Skeleton grid */
        <div className="grid grid-cols-1 gap-3 sm:auto-rows-[108px] sm:grid-cols-8 xl:grid-cols-12">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[14px] bg-slate-200 sm:col-span-4 sm:row-span-2 xl:col-span-3"
            />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-[14px] border border-dashed border-slate-300 bg-white/60 py-12 text-center">
          <div>
            <Megaphone size={28} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No announcements yet for this channel.</p>
            <p className="mt-1 text-xs text-slate-400">Check back later or contact your administrator.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:auto-rows-[108px] sm:grid-cols-8 xl:grid-cols-12">
          {announcements.map((item, i) => (
            <AnnouncementCard key={item.id} item={item} delay={i * 50} />
          ))}
        </div>
      )}
    </section>
  );
}

export default AnnouncementBoard;
