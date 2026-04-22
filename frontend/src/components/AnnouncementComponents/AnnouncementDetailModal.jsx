import { CalendarDays, Flag, ShieldCheck, Tag, X } from "lucide-react";
import { useEscapeKey } from "../../hooks/useEscapeKey";

function formatPostedAt(createdAt) {
  const dateObj = createdAt ? new Date(createdAt) : null;
  if (!dateObj || Number.isNaN(dateObj.valueOf())) return "—";
  return dateObj.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AnnouncementDetailModal({ isOpen, item, onClose }) {
  useEscapeKey(Boolean(isOpen && item), onClose);

  if (!isOpen || !item) return null;

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
      <div className="soft-enter w-full max-w-[720px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        {item.image_url && (
          <div className="relative h-[220px] w-full bg-slate-100">
            <img
              src={item.image_url}
              alt={item.title || "Announcement image"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-[999px] bg-slate-100 px-2 py-1 text-slate-600">
                <Tag size={12} />
                {item.tag || "General"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-[999px] border border-slate-200 bg-white px-2 py-1 text-slate-600">
                <Flag size={12} />
                {item.priority || "normal"}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <CalendarDays size={13} />
                {formatPostedAt(item.created_at)}
              </span>
            </div>
            <h2 className="m-0 mt-2 truncate text-xl font-semibold text-slate-900 sm:text-2xl">
              {item.title}
            </h2>
            {item.unit && (
              <p className="m-0 mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <ShieldCheck size={14} />
                {item.unit}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-[15px]">
            {item.excerpt}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementDetailModal;

