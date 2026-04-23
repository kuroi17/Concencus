import {
  ArrowUpRight,
  CalendarDays,
  Flag,
  Images,
  ShieldCheck,
  UserRound
} from "lucide-react";

const getPriorityStyle = (priorityText) => {
  if (!priorityText) return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  const p = priorityText.trim().toLowerCase();
  if (p.includes("urgent")) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
  if (p.includes("important")) return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
  if (p.includes("fyi") || p.includes("notice")) return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
  return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
};

function AnnouncementCard({ item, delay = 0, onOpen }) {
  const dateObj = item.created_at ? new Date(item.created_at) : null;
  const postedAt =
    dateObj && !isNaN(dateObj)
      ? dateObj.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  // Support both legacy single image_url and new image_urls array
  const images = Array.isArray(item.image_urls) && item.image_urls.length > 0
    ? item.image_urls
    : item.image_url
    ? [item.image_url]
    : [];

  const coverImage = images[0] || null;
  const hasMultipleImages = images.length > 1;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="break-inside-avoid mb-5 soft-rise group flex flex-col relative w-full overflow-hidden rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/10"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`Open announcement: ${item.title}`}
    >
      {coverImage && (
        <div className="relative h-[160px] w-full shrink-0 bg-slate-50 dark:bg-slate-800">
          <img
            src={coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent dark:from-black/40" />

          {/* Multiple images badge */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm">
              <Images size={10} />
              {images.length}
            </div>
          )}
        </div>
      )}

      <div className="p-6 flex flex-col w-full">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
              {item.tag}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${getPriorityStyle(item.priority)} ring-1 ring-inset`}>
              <Flag size={10} />
              {item.priority}
            </span>
          </div>

          <h3 className="m-0 text-lg font-black leading-tight text-slate-900 dark:text-white group-hover:text-[#800000] dark:group-hover:text-[#ff4d4d] transition-colors">
            {item.title}
          </h3>
        </header>

        <p className="m-0 mt-3 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
          {item.excerpt}
        </p>

        <footer className="mt-6 space-y-4">
          <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {item.unit && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#800000] dark:text-[#ff4d4d]" />
                {item.unit}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={12} />
              {postedAt}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#800000] dark:text-[#ff4d4d]">
            Full Notice
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </footer>
      </div>
    </button>
  );
}

export default AnnouncementCard;