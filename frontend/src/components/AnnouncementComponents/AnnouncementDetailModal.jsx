import { X, CalendarDays, ShieldCheck, Megaphone, Flag, UserRound } from "lucide-react";
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
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${
        isOpen && notice ? "visible pointer-events-auto" : "invisible pointer-events-none"
      }`}
    >
      {/* Integrated Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500 ${
          isOpen && notice ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-2xl transition-all duration-500 ease-out ${
          isOpen && notice ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8"
        }`}
      >
        <div className="flex flex-col md:flex-row max-h-[90vh]">
          {/* Visual Hero Side */}
          <div className="relative w-full md:w-2/5 shrink-0 bg-slate-100">
            {notice.image_url ? (
              <img
                src={notice.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <Megaphone size={64} className="text-slate-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r" />
          </div>

          {/* Content Side */}
          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            {/* Header / Actions */}
            <header className="flex items-center justify-between border-b border-slate-50 px-8 py-6">
              <div className="flex gap-2">
                <span className="rounded-lg bg-[#800000]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#800000]">
                  {notice.tag}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getPriorityStyle(notice.priority)} ring-1 ring-inset`}>
                  <Flag size={10} />
                  {notice.priority}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-900 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-8 py-10">
              <h2 className="mb-6 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {notice.title}
              </h2>

              <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                {notice.unit && (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#800000]" />
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

              <div className="h-px w-20 bg-[#800000] mb-8" />

              <article className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
                  {notice.content || notice.excerpt}
                </p>
              </article>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-50 px-8 py-6">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
              >
                Close Notice
              </button>
            </footer>
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