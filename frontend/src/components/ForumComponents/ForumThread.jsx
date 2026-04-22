import { Bookmark, Check, ChevronLeft, ChevronRight, Flag, MessageSquare, MoreVertical, Share2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import VoteWidget from "./VoteWidget";
import CommentSection from "./CommentSection";
import { supabase } from "../../lib/supabaseClient";
import { useEscapeKey } from "../../hooks/useEscapeKey";

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
        className="mt-3 overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50 cursor-zoom-in"
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
            className="relative h-[200px] w-[260px] shrink-0 cursor-zoom-in overflow-hidden rounded-[12px] border border-slate-200 bg-slate-50"
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
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-colors hover:bg-white"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} className="text-slate-700" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-colors hover:bg-white"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} className="text-slate-700" />
        </button>
      )}
    </div>
  );
}

// ── Gallery Lightbox ────────────────────────────────────────────────────────
function GalleryLightbox({ images, startIndex, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(startIndex);

  useEscapeKey(true, onClose);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") setCurrentIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIdx((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white text-lg hover:bg-white/25 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
          {currentIdx + 1} / {images.length}
        </div>
      )}

      {/* Prev arrow */}
      {currentIdx > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCurrentIdx((i) => i - 1); }}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          aria-label="Previous image"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next arrow */}
      {currentIdx < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCurrentIdx((i) => i + 1); }}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          aria-label="Next image"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Image */}
      <img
        src={images[currentIdx]}
        alt=""
        className="w-[88vw] h-[88vh] rounded-[10px] object-contain shadow-2xl transition-opacity"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

// ── Forum Thread ────────────────────────────────────────────────────────────
function ForumThread({ item, isAdmin = false, isExpanded, onToggleExpand }) {
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
      alert("You must be logged in to save posts.");
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
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .insert([{ user_id: authData.user.id, post_id: item.id }]);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
      setIsSaved(previousState); // Revert on failure
      alert("Failed to save post. Please try again.");
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
        className={`soft-enter group relative flex gap-2.5 rounded-[14px] border bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors sm:gap-3 sm:px-4 sm:py-4 ${
          isTargetPost ? "border-[#7f1d1d] ring-1 ring-[#7f1d1d]/30" : "border-slate-200/80 hover:border-slate-300"
        }`}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <VoteWidget itemId={item.id} baseScore={score} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
            <span className={item.is_anonymous ? "font-semibold text-slate-600 bg-slate-100 px-1 rounded" : ""}>
              {item.is_anonymous ? "🙈 " : ""}Posted by {authorName}
            </span>
            <span className="text-slate-400">•</span>
            <span>{timeAgo}</span>
            <span className="inline-flex rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 text-[11px] font-medium">
              {item.tag || "General"}
            </span>
          </div>

          <h3 className="m-0 mt-2 text-[1.07rem] font-semibold leading-snug text-slate-900 sm:text-[1.25rem]">
            {item.title}
          </h3>

          {/* ── Image Carousel ─────────────────────────────────────── */}
          {images.length > 0 && (
            <ImageCarousel
              images={images}
              onOpenLightbox={(idx) => setLightboxIndex(idx)}
            />
          )}

          <p className="m-0 mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {item.excerpt}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-600">
            <button
              type="button"
              onClick={onToggleExpand}
              className={`inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors ${
                isExpanded ? "bg-slate-200 text-slate-900" : "hover:bg-slate-100"
              }`}
            >
              <MessageSquare size={14} />
              <span>{comments} Comments</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/hub?post=${item.id}`;
                  try {
                    await navigator.clipboard.writeText(url);
                  } catch {
                    // fallback for older browsers
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
                className={`inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors ${
                  showCopied ? "bg-green-50 text-green-700" : "hover:bg-slate-100"
                }`}
              >
                {showCopied ? <Check size={14} /> : <Share2 size={14} />}
                <span>{showCopied ? "Copied!" : "Share"}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={toggleSave}
              className={`inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors ${
                isSaved ? "bg-amber-50 text-amber-700" : "hover:bg-slate-100"
              }`}
            >
              <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
              <span>{isSaved ? "Saved" : "Save"}</span>
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
              className="inline-flex items-center justify-center rounded-[10px] p-2 text-slate-500 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100"
              aria-label="More actions"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
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
                        alert(error.message || "Failed to delete post.");
                        return;
                      }
                      alert("Discussion deleted.");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
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
                        alert("You must be logged in to report.");
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
                        alert(error.message || "Failed to submit report.");
                        return;
                      }

                      alert("Report submitted. Thanks for helping keep the community safe.");
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
