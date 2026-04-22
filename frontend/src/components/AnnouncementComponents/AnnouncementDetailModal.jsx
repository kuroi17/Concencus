import { useState } from "react";
import { X, CalendarDays, ShieldCheck, Tag, Flag, UserRound, Trash2 } from "lucide-react";
import { useEscapeKey } from "../../hooks/useEscapeKey";

const getPriorityStyle = (priorityText) => {
  if (!priorityText) return "bg-slate-100 text-slate-600 border-slate-200";
  const p = priorityText.trim().toLowerCase();
  if (p.includes("urgent")) return "bg-red-100 text-red-700 border-red-200";
  if (p.includes("important")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (p.includes("fyi") || p.includes("notice")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

function AnnouncementDetailModal({ isOpen, onClose, notice, isAdmin, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEscapeKey(Boolean(isOpen && notice), onClose);

  if (!isOpen || !notice) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await onDelete(notice.id, notice.image_url);
    if (!success) setIsDeleting(false);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Announcement details"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="soft-enter relative w-full max-w-2xl overflow-hidden rounded-[16px] bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {notice.image_url && (
          <div className="relative h-[200px] w-full shrink-0 bg-slate-100">
            <img
              src={notice.image_url}
              alt={notice.title || "Announcement image"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          </div>
        )}

        {/* ── Close Button (Laging nasa top right) ── */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/50 focus:outline-none"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* ── Content Area (Scrollable) ── */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <header className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-[8px] bg-slate-100 px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                <Tag size={13} />
                {notice.tag}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${getPriorityStyle(notice.priority)}`}
              >
                <Flag size={13} />
                {notice.priority}
              </span>
            </div>

            <h2 className="text-2xl font-bold leading-snug text-slate-900">
              {notice.title}
            </h2>

            {/* Notice Metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500 border-b border-slate-100 pb-4">
              {notice.unit && (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  {notice.unit}
                </span>
              )}
              {notice.author && (
                <span className="inline-flex items-center gap-1.5">
                  <UserRound size={14} />
                  {notice.author}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {postedAt}
              </span>
            </div>
          </header>

          {/* ── Full Text Description ── */}
          <div className="text-slate-700">
            <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
              {notice.content || notice.excerpt}
            </p>
          </div>

          {/* ── Admin Delete Section ── */}
          {isAdmin && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              {confirmDelete ? (
                <div className="flex flex-col gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    Delete this announcement? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 rounded-[10px] bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-70"
                    >
                      <Trash2 size={14} />
                      {isDeleting ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                      className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-70"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete Announcement
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AnnouncementDetailModal;