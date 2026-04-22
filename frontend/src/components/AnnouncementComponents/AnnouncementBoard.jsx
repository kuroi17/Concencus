import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Megaphone, X, CalendarDays, ShieldCheck, Flag, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import AnnouncementCard from "./AnnouncementCard";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import { uploadPublicImage } from "../../lib/storage";

function AnnouncementBoard({ channelId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const { user, isAdmin } = useCurrentUserProfile();

  const fetchAnnouncements = useCallback(async () => {
    if (!channelId) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }
    queueMicrotask(() => {
      setLoading(true);
    });

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("channel_id", channelId)
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
      let finalImageUrl = null;

      // 🚀 1. UPLOAD IMAGE SA SUPABASE BUCKET
      if (announcementData.imageFile) {
        try {
          finalImageUrl = await uploadPublicImage(
            announcementData.imageFile,
            'announcement-images'
          );
        } catch (uploadErr) {
          // Ipakita ang TUNAY na error, hindi generic
          console.error('Upload error details:', uploadErr);
          throw new Error(`Image upload failed: ${uploadErr.message}`);
        }
      }

      // 🚀 2. I-SAVE SA DATABASE KASAMA YUNG LINK NG PICTURE
      const { error } = await supabase.from("announcements").insert([
        {
          channel_id: channelId,
          author_id: user.id,
          title: announcementData.title,
          excerpt: announcementData.excerpt,
          tag: announcementData.tag,
          priority: announcementData.priority,
          unit: announcementData.unit || null,
          image_url: finalImageUrl // Mapupuno ito kung may picture
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

  const handleDeleteAnnouncement = async (announcementId, imageUrl) => {
    if (!isAdmin) return false;

    try {
      // 1. I-delete sa database muna
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementId);

      if (error) throw error;

      // 2. Kapag successful sa DB, tanggalin na rin sa bucket (kung may image)
      if (imageUrl) {
        try {
          await deletePublicImage(imageUrl, 'announcement-images');
        } catch (storageErr) {
          // Hindi natin i-block ang success kahit may storage error
          // DB record na deleted na, yung image lang ang naiwan sa bucket
          console.warn('Announcement deleted but image cleanup failed:', storageErr.message);
        }
      }

      setSelectedNotice(null);
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      queueMicrotask(() => {
        fetchAnnouncements();
      });
    }

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
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, [channelId, fetchAnnouncements]);

  const [selectedTag, setSelectedTag] = useState("All");

  const tags = ["All", ...new Set(announcements.map(a => a.tag).filter(Boolean))];

  const filteredAnnouncements = selectedTag === "All" 
    ? announcements 
    : announcements.filter(a => a.tag === selectedTag);

  return (
    <section className="soft-enter pb-2 w-full overflow-x-hidden box-border" aria-label="Announcement board">
      {/* ── Board header ──────────────────────────────────────────────────── */}
      <div className="mb-8 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="m-0 text-lg font-black uppercase tracking-[0.2em] text-slate-400">
            Institutional Notices
          </h2>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isPosting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#800000] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0 disabled:opacity-70"
            >
              <Megaphone size={16} />
              <span>{isPosting ? "Posting..." : "Create Notice"}</span>
            </button>
          )}
        </header>

        {/* ── Tag Filters ────────────────────────────────────────────────── */}
        <nav className="flex flex-wrap items-center gap-2" aria-label="Filter notices by tag">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                selectedTag === tag
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "bg-white text-slate-500 ring-1 ring-slate-200/60 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tag}
            </button>
          ))}
        </nav>
      </div>

      {postError && (
        <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-bold text-rose-600">
          {postError}
        </p>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {selectedAnnouncement && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xl p-4 sm:p-8 md:p-12 soft-enter no-scrollbar cursor-pointer"
          onClick={(e) => e.target === e.currentTarget && setSelectedAnnouncement(null)}
        >
          <div className="cursor-default w-full max-w-6xl h-[85vh] max-h-[900px]">
            <AnnouncementDetailHero
              key={selectedAnnouncement.id}
              notice={selectedAnnouncement}
              onClose={() => setSelectedAnnouncement(null)}
            />
          </div>
        </div>,
        document.body
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-[32px] bg-slate-200/60" />
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-white/40 px-6 text-center">
          <Megaphone size={40} className="mb-4 text-slate-200" />
          <h3 className="text-lg font-black text-slate-900">No matching notices</h3>
          <p className="mt-1 max-w-xs text-sm font-medium text-slate-500">
            There are currently no announcements under this category.
          </p>
          {selectedTag !== "All" && (
            <button 
              onClick={() => setSelectedTag("All")}
              className="mt-6 text-xs font-black uppercase tracking-widest text-[#800000] hover:underline"
            >
              Show all notices
            </button>
          )}
        </div>
      ) : (
        <div className="w-full columns-1 gap-6 px-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
          {filteredAnnouncements.map((item, i) => (
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
    </section>
  );
}

/** ── Integrated Detail View ────────────────────────────────────────────── */
function AnnouncementDetailHero({ notice, onClose }) {
  const getPriorityStyle = (priorityText) => {
    if (!priorityText) return "bg-slate-100 text-slate-600 border-slate-200";
    const p = priorityText.trim().toLowerCase();
    if (p.includes("urgent")) return "bg-red-100 text-red-700 border-red-200";
    if (p.includes("important")) return "bg-orange-100 text-orange-700 border-orange-200";
    if (p.includes("fyi") || p.includes("notice")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const dateObj = notice.created_at ? new Date(notice.created_at) : null;
  const postedAt =
    dateObj && !isNaN(dateObj)
      ? dateObj.toLocaleDateString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[32px] sm:rounded-[48px] bg-white shadow-[0_32px_128px_rgba(0,0,0,0.5)] flex flex-col md:flex-row soft-rise">
      {/* Hero Visual Area (Left/Top) */}
      <div className="relative h-[300px] w-full shrink-0 md:h-full md:w-[40%] lg:w-[45%] overflow-hidden bg-slate-900">
        {notice.image_url ? (
          <img src={notice.image_url} className="h-full w-full object-cover" alt="" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <Megaphone size={80} className="text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 md:from-transparent to-transparent" />
        
        {/* Tag on Image (Mobile only or just for flair) */}
        <div className="absolute bottom-6 left-6 md:hidden">
          <span className="rounded-xl bg-[#800000] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
            {notice.tag}
          </span>
        </div>
      </div>

      {/* Content Area (Right/Bottom) */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
        {/* Header Action Bar */}
        <header className="flex items-center justify-between border-b border-slate-50 px-8 py-6 md:px-12">
          <div className="hidden md:flex gap-3">
            <span className="rounded-xl bg-[#800000]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#800000]">
              {notice.tag}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${getPriorityStyle(notice.priority)} ring-1 ring-inset`}>
              <Flag size={12} />
              {notice.priority}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 transition-all hover:bg-[#800000] hover:text-white"
            aria-label="Close Notice"
          >
            <X size={24} />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-10 md:px-16 md:py-14 no-scrollbar">
          <div className="max-w-3xl">
            <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              {notice.unit && (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#800000]" />
                  {notice.unit}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} />
                {postedAt}
              </span>
            </div>

            <h1 className="mb-8 text-3xl font-black leading-[1.2] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              {notice.title}
            </h1>

            <div className="mb-10 h-1.5 w-20 rounded-full bg-[#800000]" />

            <article className="prose prose-slate prose-lg lg:prose-xl max-w-none">
              <p className="whitespace-pre-wrap font-medium leading-relaxed text-slate-600">
                {notice.content || notice.excerpt}
              </p>
            </article>
            
            <div className="mt-16 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#800000] font-black">
                  <UserRound size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Publisher</p>
                  <p className="text-lg font-black text-slate-900">{notice.author || "Institutional Admin"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export default AnnouncementBoard;
