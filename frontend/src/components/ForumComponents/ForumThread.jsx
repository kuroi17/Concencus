import { Bookmark, Check, ChevronLeft, ChevronRight, Flag, MessageSquare, MoreVertical, Share2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import VoteWidget from "./VoteWidget";
import CommentSection from "./CommentSection";
import { supabase } from "../../lib/supabaseClient";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import toast from "react-hot-toast";
import SDGBadge from "../Common/SDGBadge";

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

/** Resolve image list — prefer image_urls array, fall back to legacy image_url. */
function getImageUrls(item) {
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    return item.image_urls;
  }
  if (item.image_url) return [item.image_url];
  return [];
}

// ── Horizontal scroll carousel ──────────────────────────────────────────────
// ── Horizontal scroll carousel ──────────────────────────────────────────────
function ImageCarousel({ images, onOpenLightbox }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el?.removeEventListener("scroll", updateScrollState);
  }, [images]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  if (images.length === 1) {
    return (
      <div
        className="mt-3 overflow-hidden rounded-[12px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 cursor-zoom-in"
        onClick={() => onOpenLightbox(0)}
        title="Click to view full image"
      >
        <img
          src={images[0]}
          alt=""
          className="max-h-[340px] w-full object-cover hover:opacity-95 transition-opacity"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="relative mt-3">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth rounded-[12px] pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {images.map((url, idx) => (
          <div
            key={url}
            className="relative h-[200px] w-[260px] shrink-0 cursor-zoom-in overflow-hidden rounded-[12px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            onClick={() => onOpenLightbox(idx)}
            title="Click to view full image"
          >
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover hover:opacity-95 transition-opacity"
              loading="lazy"
            />
            {/* Image counter badge */}
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {idx + 1}/{images.length}
            </span>
          </div>
        ))}
      </div>

      {/* Scroll arrows */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md backdrop-blur transition-colors hover:bg-white dark:hover:bg-slate-700"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} className="text-slate-700 dark:text-slate-300" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md backdrop-blur transition-colors hover:bg-white dark:hover:bg-slate-700"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} className="text-slate-700 dark:text-slate-300" />
        </button>
      )}
    </div>
  );
}

// ... GalleryLightbox component ...

// ── Forum Thread ────────────────────────────────────────────────────────────
function ForumThread({ item, isAdmin = false, isExpanded, onToggleExpand, onBack }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Capture on mount so highlight persists even after clearing the URL
  const [isTargetPost] = useState(() => searchParams.get("post") === item.id);
  const threadRef = useRef(null);

  useEffect(() => {
    if (isTargetPost && threadRef.current) {
      setTimeout(() => {
        threadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        // Clear URL param so it doesn't keep scrolling if user leaves and returns
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev);
          params.delete("post");
          return params;
        }, { replace: true });
      }, 500); // Wait for potential rendering
    }
  }, [isTargetPost, setSearchParams]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1); // -1 = closed
  const [isSaved, setIsSaved] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Check if user has saved this post
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user || cancelled) return;
      const { data } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", authData.user.id)
        .eq("post_id", item.id)
        .maybeSingle();
      if (!cancelled) setIsSaved(Boolean(data));
    })();
    return () => { cancelled = true; };
  }, [item.id]);

  const toggleSave = async () => {
    // Optimistic update
    const previousState = isSaved;
    setIsSaved(!previousState);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setIsSaved(previousState); // Revert
      toast.error("You must be logged in to save posts.");
      return;
    }

    try {
      if (previousState) {
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("user_id", authData.user.id)
          .eq("post_id", item.id);
        if (error) throw error;
        toast.success("Post unsaved!");
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .insert([{ user_id: authData.user.id, post_id: item.id }]);
        if (error) throw error;
        toast.success("Post saved!");
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setIsSaved(previousState); // Revert on failure
      toast.error("Failed to save post. Please try again.");
    }
  };

  const authorName = item.is_anonymous ? "Anonymous" : (item.author_name || "User");
  const timeAgo = timeAgoStr(item.created_at);

  // Convert score from big query safely
  const score = item.score ? parseInt(item.score, 10) : 0;
  const comments = item.comment_count ? parseInt(item.comment_count, 10) : 0;
  const images = getImageUrls(item);

  useEscapeKey(isMenuOpen, () => setIsMenuOpen(false));

  return (
    <div className="flex flex-col gap-2" ref={threadRef}>
      <article
        className={`soft-enter group relative flex gap-3.5 rounded-[24px] border bg-white dark:bg-slate-900 px-4 py-5 shadow-[0_15px_45px_rgba(15,23,42,0.04)] dark:shadow-[0_15px_45px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:gap-5 sm:px-6 sm:py-6 ${
          isTargetPost ? "border-[#800000] ring-1 ring-[#800000]/20" : "border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
        }`}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <div className="shrink-0">
          <VoteWidget itemId={item.id} baseScore={score} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ${
              item.is_anonymous ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" : "bg-red-50 dark:bg-red-900/20 text-[#800000] dark:text-red-400"
            }`}>
              {item.is_anonymous ? "🙈 Anonymous" : `👤 ${authorName}`}
            </span>
            <span className="text-slate-200 dark:text-slate-800">/</span>
            <span className="text-slate-400 dark:text-slate-500">{timeAgo}</span>
            <span className="inline-flex rounded-md bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[10px] font-black shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 text-slate-400 dark:text-slate-500">
              {item.tag || "General"}
            </span>
            {item.sdg_tags && item.sdg_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.sdg_tags.map(tagId => (
                  <SDGBadge key={tagId} sdgId={tagId} />
                ))}
              </div>
            )}
          </div>

          <h3 className="m-0 mt-3.5 text-[1.15rem] font-black leading-tight text-slate-900 dark:text-white sm:text-[1.45rem] tracking-tight group-hover:text-[#800000] dark:group-hover:text-red-400 transition-colors">
            {item.title}
          </h3>

          {/* ── Image Carousel ─────────────────────────────────────── */}
          {images.length > 0 && (
            <ImageCarousel
              images={images}
              onOpenLightbox={(idx) => setLightboxIndex(idx)}
            />
          )}

          <p className="m-0 mt-3 text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
            {item.excerpt}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={onToggleExpand}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                isExpanded ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare size={14} className={isExpanded ? "text-amber-400" : ""} />
              <span>{comments} Comments</span>
            </button>
            
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/hub?post=${item.id}`;
                try {
                  await navigator.clipboard.writeText(url);
                } catch {
                  const ta = document.createElement("textarea");
                  ta.value = url;
                  ta.style.position = "fixed";
                  ta.style.opacity = "0";
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand("copy");
                  document.body.removeChild(ta);
                }
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                showCopied ? "bg-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {showCopied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{showCopied ? "Copied!" : "Share Link"}</span>
            </button>

            <button
              type="button"
              onClick={toggleSave}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                isSaved ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-200 dark:ring-amber-800" : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
              <span>{isSaved ? "Saved" : "Save Post"}</span>
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
              className="inline-flex items-center justify-center rounded-[10px] p-2 text-slate-500 dark:text-slate-500 opacity-0 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 group-hover:opacity-100 focus:opacity-100"
              aria-label="More actions"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-[12px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.14)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
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
                        toast.error(error.message || "Failed to delete post.");
                        return;
                      }
                      toast.success("Discussion deleted.");
                      if (onBack) onBack();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-700 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
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
                        toast.error("You must be logged in to report.");
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
                        toast.error(error.message || "Failed to submit report.");
                        return;
                      }

                      toast.success("Report submitted. Thanks for helping keep the community safe.");
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
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

      {/* Gallery Lightbox */}
      {lightboxIndex >= 0 && images.length > 0 && (
        <GalleryLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}
    </div>
  );
}

export default ForumThread;
