import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import AnnouncementCard from "./AnnouncementCard";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import { uploadPublicImage } from "../../lib/storage";
import AnnouncementDetailModal from "./AnnouncementDetailModal";

function AnnouncementBoard({ channelId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const { user, isAdmin } = useCurrentUserProfile();

  const fetchAnnouncements = useCallback(async () => {
    if (!channelId) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
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
  }, [channelId]);

  const handleCreateAnnouncement = async (announcementData) => {
    if (!channelId) {
      setPostError("Please select a channel first.");
      return false;
    }

    if (!user || !isAdmin) {
      setPostError("Only admins can post announcements.");
      return false;
    }

    setIsPosting(true);
    setPostError("");

    try {
      let imageUrl = null;
      if (announcementData?.imageFile) {
        imageUrl = await uploadPublicImage({
          bucket: "announcement-images",
          pathPrefix: `${user.id}/${channelId}`,
          file: announcementData.imageFile,
        });
      }

      const { error } = await supabase.from("announcements").insert([
        {
          channel_id: channelId,
          author_id: user.id,
          title: announcementData.title,
          excerpt: announcementData.excerpt,
          tag: announcementData.tag,
          priority: announcementData.priority,
          unit: announcementData.unit || null,
          image_url: imageUrl,
        },
      ]);

      if (error) {
        throw error;
      }

      setIsModalOpen(false);
      await fetchAnnouncements();
      return true;
    } catch (error) {
      setPostError(error.message || "Failed to post announcement.");
      return false;
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      setAnnouncements([]); // clear stale items on channel switch
      fetchAnnouncements();
    });

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
  }, [channelId, fetchAnnouncements]);

  return (
    <section className="soft-enter pb-2" aria-label="Announcement board">
      {/* ── Board header ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold text-slate-900 sm:text-lg">
          Announcement Board
        </h2>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isPosting}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#7f1d1d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:opacity-70"
            aria-label="Post Announcement"
          >
            <Megaphone size={15} />
            <span>{isPosting ? "Posting..." : "Post Announcement"}</span>
          </button>
        )}
      </div>

      {postError && (
        <p className="mb-3 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {postError}
        </p>
      )}

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
            <p className="text-sm font-medium text-slate-500">
              No announcements yet for this channel.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Check back later or contact your administrator.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:auto-rows-[108px] sm:grid-cols-8 xl:grid-cols-12">
          {announcements.map((item, i) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              delay={i * 50}
              onOpen={() => setSelectedAnnouncement(item)}
            />
          ))}
        </div>
      )}

      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />

      <AnnouncementDetailModal
        isOpen={Boolean(selectedAnnouncement)}
        item={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </section>
  );
}

export default AnnouncementBoard;
