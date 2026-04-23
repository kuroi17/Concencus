import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone, X, CalendarDays, ShieldCheck, Flag, UserRound,
  ChevronLeft, ChevronRight, Pencil, Trash2, Check, Images,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import AnnouncementCard from "./AnnouncementCard";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import { useCurrentUserProfile } from "../../hooks/useCurrentUserProfile";
import { uploadPublicImage, deletePublicImage } from "../../lib/storage";
import { AnnouncementSkeleton } from "../../common/Skeleton";
import { EmptyState } from "../../common/EmptyState";

// ── Tags + Priorities ─────────────────────────────────────────────────────────
const TAGS = ["Academic", "Event", "Opportunity", "Governance", "Maintenance"];
const PRIORITIES = ["FYI", "Normal", "Important", "Urgent"];

// ── Image Carousel ─────────────────────────────────────────────────────────────
function ImageCarousel({ images, onImageClick }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) return null;

  const prev = (e) => {
    e.stopPropagation();
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };
  const next = (e) => {
    e.stopPropagation();
    setCurrent((c) => (c + 1) % images.length);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900 dark:bg-black group/carousel">
      {/* Main image */}
      <img
        src={images[current]}
        alt={`Image ${current + 1} of ${images.length}`}
        className="h-full w-full object-cover cursor-zoom-in transition-opacity duration-300"
        onClick={() => onImageClick(images[current])}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 md:from-transparent to-transparent pointer-events-none" />

      {/* Prev/Next buttons — only if multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>

          {/* Counter badge */}
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm pointer-events-none">
            <Images size={10} />
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Edit Panel (inline inside detail hero) ────────────────────────────────────
function EditPanel({ notice, onSave, onCancel, isSaving }) {
  const [title, setTitle] = useState(notice.title || "");
  const [excerpt, setExcerpt] = useState(notice.excerpt || notice.content || "");
  const [tag, setTag] = useState(notice.tag || TAGS[0]);
  const [priority, setPriority] = useState(notice.priority || PRIORITIES[0]);
  const [unit, setUnit] = useState(notice.unit || "");

  // Existing images from DB (URLs). Admin can remove these.
  const existingImages = Array.isArray(notice.image_urls) && notice.image_urls.length > 0
    ? notice.image_urls
    : notice.image_url
    ? [notice.image_url]
    : [];
  const [keptImages, setKeptImages] = useState(existingImages); // subset of existingImages to keep
  const [removedImages, setRemovedImages] = useState([]);        // URLs to delete from storage on save

  // New images picked by the admin (File objects + preview URLs)
  const [newImages, setNewImages] = useState([]);

  const handleRemoveExisting = (url) => {
    setKeptImages((prev) => prev.filter((u) => u !== url));
    setRemovedImages((prev) => [...prev, url]);
  };

  const handleAddNew = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const entries = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
    }));
    setNewImages((prev) => [...prev, ...entries]);
    e.target.value = "";
  };

  const handleRemoveNew = (id) => {
    setNewImages((prev) => {
      const entry = prev.find((n) => n.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((n) => n.id !== id);
    });
  };

  const handleSave = () => {
    if (!title.trim() || !excerpt.trim()) return;
    onSave({
      title: title.trim(),
      excerpt: excerpt.trim(),
      tag,
      priority,
      unit: unit.trim(),
      keptImages,        // existing URLs to keep
      removedImages,     // existing URLs to delete from storage
      newImageFiles: newImages.map((n) => n.file), // new File objects to upload
    });
  };

  const totalImageCount = keptImages.length + newImages.length;

  const inputCls = "w-full rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-[#800000]";
  const labelCls = "mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500";

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Message</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tag</label>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className={inputCls}>
            {TAGS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Unit / Office</label>
        <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} placeholder="CICS Student Affairs" />
      </div>

      {/* ── Image Editor ── */}
      <div>
        <label className={labelCls}>
          Images
          <span className="ml-1.5 normal-case font-normal text-slate-400">
            ({totalImageCount} total · first = cover)
          </span>
        </label>

        <div className="flex flex-wrap gap-2 mt-2">
          {/* Existing images */}
          {keptImages.map((url, i) => (
            <div
              key={url}
              className={`relative group rounded-[10px] overflow-hidden border-2 transition-colors ${
                i === 0 && newImages.length === 0
                  ? "border-[#800000] ring-2 ring-[#800000]/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
              style={{ width: 72, height: 72 }}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && newImages.length === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-[#800000] text-white text-[7px] font-black uppercase tracking-wider text-center py-0.5">
                  Cover
                </span>
              )}
              {!isSaving && (
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(url)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}

          {/* New (pending upload) images */}
          {newImages.map((img, i) => {
            const isCover = keptImages.length === 0 && i === 0;
            return (
              <div
                key={img.id}
                className={`relative group rounded-[10px] overflow-hidden border-2 transition-colors ${
                  isCover ? "border-[#800000] ring-2 ring-[#800000]/20" : "border-slate-200 dark:border-slate-700"
                }`}
                style={{ width: 72, height: 72 }}
              >
                <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                {isCover && (
                  <span className="absolute bottom-0 inset-x-0 bg-[#800000] text-white text-[7px] font-black uppercase tracking-wider text-center py-0.5">
                    Cover
                  </span>
                )}
                {/* "New" badge */}
                <span className="absolute top-1 left-1 rounded-md bg-emerald-500 px-1 text-[7px] font-black text-white uppercase">
                  New
                </span>
                {!isSaving && (
                  <button
                    type="button"
                    onClick={() => handleRemoveNew(img.id)}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label="Remove new image"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add more button */}
          {!isSaving && (
            <label
              className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-[#800000] hover:bg-[#800000]/5 transition-colors"
              style={{ width: 72, height: 72 }}
            >
              <Images size={16} className="text-slate-400" />
              <span className="text-[8px] font-bold text-slate-400 mt-1">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddNew}
                disabled={isSaving}
              />
            </label>
          )}
        </div>

        {removedImages.length > 0 && (
          <p className="mt-2 text-[10px] text-red-500 font-semibold">
            {removedImages.length} image{removedImages.length > 1 ? "s" : ""} will be removed on save.
          </p>
        )}
        {newImages.length > 0 && (
          <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {newImages.length} new image{newImages.length > 1 ? "s" : ""} will be uploaded on save.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#800000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a00000] disabled:opacity-70 transition-colors"
        >
          <Check size={14} />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-70 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Priority Style Helper ─────────────────────────────────────────────────────
function getPriorityStyle(priorityText) {
  if (!priorityText) return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  const p = priorityText.trim().toLowerCase();
  if (p.includes("urgent")) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
  if (p.includes("important")) return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800";
  if (p.includes("fyi") || p.includes("notice")) return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
}

// ── Announcement Detail Hero ───────────────────────────────────────────────────
function AnnouncementDetailHero({ notice, onClose, onImageClick, isAdmin, onDelete, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localNotice, setLocalNotice] = useState(notice);

  // Sync if parent notice changes (e.g. after realtime update)
  useEffect(() => { setLocalNotice(notice); }, [notice]);

  const dateObj = localNotice.created_at ? new Date(localNotice.created_at) : null;
  const postedAt = dateObj && !isNaN(dateObj)
    ? dateObj.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  // Normalize images: support new image_urls array and legacy image_url
  const images = Array.isArray(localNotice.image_urls) && localNotice.image_urls.length > 0
    ? localNotice.image_urls
    : localNotice.image_url
    ? [localNotice.image_url]
    : [];

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await onDelete(localNotice.id, images);
    if (!success) setIsDeleting(false);
  };

  const handleSaveEdit = async (fields) => {
    setIsSaving(true);
    const success = await onEdit(localNotice.id, fields);
    if (success) {
      // Optimistically update local state so carousel reflects changes immediately
      const finalImageUrls = [...(fields.keptImages || [])];
      // Note: newly uploaded URLs aren't available here yet (they come back via fetchAnnouncements),
      // so we show kept images instantly and the realtime refetch fills in the rest.
      setLocalNotice((prev) => ({
        ...prev,
        ...fields,
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : prev.image_urls,
        image_url: finalImageUrls[0] || prev.image_url,
      }));
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[32px] sm:rounded-[48px] bg-white dark:bg-slate-900 shadow-[0_32px_128px_rgba(0,0,0,0.5)] flex flex-col md:flex-row soft-rise">
      {/* ── Hero Visual (Left/Top) ── */}
      <div className="relative h-[300px] w-full shrink-0 md:h-full md:w-[40%] lg:w-[45%] overflow-hidden">
        {images.length > 0 ? (
          <ImageCarousel images={images} onImageClick={onImageClick} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <Megaphone size={80} className="text-white/10" />
          </div>
        )}

        {/* Mobile tag badge */}
        <div className="absolute bottom-6 left-6 md:hidden z-10">
          <span className="rounded-xl bg-[#800000] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
            {localNotice.tag}
          </span>
        </div>
      </div>

      {/* ── Content (Right/Bottom) ── */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
        {/* Header bar */}
        <header className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 px-8 py-6 md:px-12">
          <div className="hidden md:flex gap-3">
            <span className="rounded-xl bg-[#800000]/10 dark:bg-[#800000]/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#800000] dark:text-red-400">
              {localNotice.tag}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${getPriorityStyle(localNotice.priority)} ring-1 ring-inset`}>
              <Flag size={12} />
              {localNotice.priority}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Edit button (admin only) */}
            {isAdmin && !isEditing && (
              <button
                onClick={() => { setConfirmDelete(false); setIsEditing(true); }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:bg-[#800000]/10 hover:text-[#800000] dark:hover:text-red-400"
                aria-label="Edit announcement"
              >
                <Pencil size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white transition-all hover:bg-[#800000] hover:text-white"
              aria-label="Close notice"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-10 md:px-16 md:py-14 no-scrollbar">
          <div className="max-w-3xl">
            {isEditing ? (
              <>
                <p className="mb-6 text-xs font-black uppercase tracking-widest text-[#800000] dark:text-red-400">
                  Editing Announcement
                </p>
                <EditPanel
                  notice={localNotice}
                  onSave={handleSaveEdit}
                  onCancel={() => setIsEditing(false)}
                  isSaving={isSaving}
                />
              </>
            ) : (
              <>
                <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {localNotice.unit && (
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#800000] dark:text-red-500" />
                      {localNotice.unit}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} />
                    {postedAt}
                  </span>
                </div>

                <h1 className="mb-8 text-3xl font-black leading-[1.2] tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
                  {localNotice.title}
                </h1>

                <div className="mb-10 h-1.5 w-20 rounded-full bg-[#800000]" />

                <article className="prose prose-slate dark:prose-invert prose-lg lg:prose-xl max-w-none">
                  <p className="whitespace-pre-wrap font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                    {localNotice.content || localNotice.excerpt}
                  </p>
                </article>

                <div className="mt-16 border-t border-slate-100 dark:border-slate-800 pt-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#800000] dark:text-red-400 font-black">
                      <UserRound size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Official Publisher</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{localNotice.author || "Institutional Admin"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Admin Delete Footer */}
        {isAdmin && !isEditing && (
          <footer className="border-t border-slate-100 dark:border-slate-800 px-8 py-5 md:px-12">
            {confirmDelete ? (
              <div className="flex flex-col gap-3 rounded-[12px] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Delete this announcement? This cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70 transition-colors"
                  >
                    <Trash2 size={14} />
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={14} />
                Delete Announcement
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

// ── Main Board ─────────────────────────────────────────────────────────────────
function AnnouncementBoard({ channelId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedTag, setSelectedTag] = useState("All");
  const { user, isAdmin } = useCurrentUserProfile();

  const fetchAnnouncements = useCallback(async () => {
    if (!channelId) { setAnnouncements([]); setLoading(false); return; }
    queueMicrotask(() => setLoading(true));

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false });

    if (!error && data) setAnnouncements(data);
    else if (error) console.error("AnnouncementBoard fetch error:", error);
    setLoading(false);
  }, [channelId]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreateAnnouncement = async (announcementData) => {
    if (!channelId) { setPostError("Please select a channel first."); return false; }
    if (!user || !isAdmin) { setPostError("Only admins can post announcements."); return false; }

    setIsPosting(true);
    setPostError("");

    try {
      // Upload all images in order, collect URLs
      const imageUrls = [];
      if (announcementData.imageFiles && announcementData.imageFiles.length > 0) {
        for (const file of announcementData.imageFiles) {
          try {
            const url = await uploadPublicImage(file, "announcement-images");
            imageUrls.push(url);
          } catch (uploadErr) {
            throw new Error(`Image upload failed: ${uploadErr.message}`);
          }
        }
      }

      const { error } = await supabase.from("announcements").insert([{
        channel_id: channelId,
        author_id: user.id,
        title: announcementData.title,
        excerpt: announcementData.excerpt,
        tag: announcementData.tag,
        priority: announcementData.priority,
        unit: announcementData.unit || null,
        // Store array; keep legacy image_url as first image for backwards compat
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        image_url: imageUrls[0] || null,
      }]);

      if (error) throw error;
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


   // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteAnnouncement = async (announcementId, images = []) => {
    if (!isAdmin) return false;
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", announcementId);
      if (error) throw error;

      // Delete all images from storage
      const imageList = Array.isArray(images) ? images : [images].filter(Boolean);
      for (const url of imageList) {
        try { await deletePublicImage(url, "announcement-images"); }
        catch (e) { console.warn("Image cleanup failed:", e.message); }
      }

      setSelectedAnnouncement(null);
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const handleEditAnnouncement = async (announcementId, fields) => {
    if (!isAdmin) return false;
    try {
      // 1. Upload new images first
      const uploadedUrls = [];
      if (fields.newImageFiles && fields.newImageFiles.length > 0) {
        for (const file of fields.newImageFiles) {
          try {
            const url = await uploadPublicImage(file, "announcement-images");
            uploadedUrls.push(url);
          } catch (uploadErr) {
            throw new Error(`Image upload failed: ${uploadErr.message}`);
          }
        }
      }

      // 2. Build final image array: kept existing + newly uploaded (in that order)
      const finalImageUrls = [...(fields.keptImages || []), ...uploadedUrls];

      // 3. Update the DB record
      const { error } = await supabase
        .from("announcements")
        .update({
          title: fields.title,
          excerpt: fields.excerpt,
          tag: fields.tag,
          priority: fields.priority,
          unit: fields.unit || null,
          image_urls: finalImageUrls.length > 0 ? finalImageUrls : null,
          image_url: finalImageUrls[0] || null, // keep legacy column in sync
        })
        .eq("id", announcementId);

      if (error) throw error;

      // 4. Delete removed images from storage (non-blocking)
      if (fields.removedImages && fields.removedImages.length > 0) {
        for (const url of fields.removedImages) {
          try { await deletePublicImage(url, "announcement-images"); }
          catch (e) { console.warn("Image cleanup failed:", e.message); }
        }
      }

      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error("Edit error:", error);
      return false;
    }
  };
  useEffect(() => {
    let isMounted = true;
    if (isMounted) queueMicrotask(() => fetchAnnouncements());

    const subscription = supabase
      .channel(`announcements_${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, fetchAnnouncements)
      .subscribe();

    return () => { isMounted = false; supabase.removeChannel(subscription); };
  }, [channelId, fetchAnnouncements]);

  const tags = ["All", ...new Set(announcements.map((a) => a.tag).filter(Boolean))];
  const filteredAnnouncements = selectedTag === "All"
    ? announcements
    : announcements.filter((a) => a.tag === selectedTag);

  return (
    <section className="soft-enter pb-2 w-full overflow-visible box-border" aria-label="Announcement board">
      {/* Board header */}
      <div className="mb-8 space-y-6 pt-2">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="m-0 text-lg font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Institutional Notices
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isPosting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#800000] px-6 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0 disabled:opacity-70"
            >
              <Megaphone size={16} />
              <span>{isPosting ? "Posting..." : "Create Notice"}</span>
            </button>
          )}
        </header>

        {postError && (
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{postError}</p>
        )}

        {/* Tag Filters */}
        <nav className="flex flex-wrap items-center gap-2" aria-label="Filter notices by tag">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                selectedTag === tag
                  ? "bg-[#800000] text-white shadow-lg shadow-red-900/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </nav>
      </div>

      {/* Detail Hero (portal) */}
      {selectedAnnouncement && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-12">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            onClick={() => setSelectedAnnouncement(null)}
          />
          <div className="relative w-full max-w-6xl" style={{ height: "min(90vh, 700px)" }}>
            <AnnouncementDetailHero
              key={selectedAnnouncement.id}
              notice={selectedAnnouncement}
              onClose={() => setSelectedAnnouncement(null)}
              onImageClick={(url) => setLightboxImage(url)}
              isAdmin={isAdmin}
              onDelete={handleDeleteAnnouncement}
              onEdit={handleEditAnnouncement}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="w-full columns-1 gap-6 px-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="mb-6 break-inside-avoid"><AnnouncementSkeleton /></div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No matching notices"
          description="There are currently no announcements under this category."
          action={
            selectedTag !== "All" && (
              <button
                onClick={() => setSelectedTag("All")}
                className="mt-6 text-xs font-black uppercase tracking-widest text-[#800000] dark:text-red-400 hover:underline"
              >
                Show all notices
              </button>
            )
          }
        />
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

      {/* Create modal */}
      {createPortal(
        <CreateAnnouncementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateAnnouncement}
        />,
        document.body
      )}

      {/* Fullscreen Lightbox */}
      {lightboxImage && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl soft-enter cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition-all hover:bg-white/20"
            aria-label="Close Lightbox"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImage}
            alt="Full view"
            className="h-auto max-h-[90vh] w-auto max-w-[95vw] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </section>
  );
}

export default AnnouncementBoard;