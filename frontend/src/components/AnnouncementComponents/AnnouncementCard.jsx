import {
  ArrowUpRight,
  CalendarDays,
  Flag,
  ShieldCheck,
  Tag,
} from "lucide-react";

function AnnouncementCard({ item, delay = 0, onOpen }) {
  // The DB doesn't have a layout field — all cards use standard span.
  // This can be extended later when layout is added to the announcements table.
  const spanClass = "sm:col-span-4 xl:col-span-3 sm:row-span-2";

  // Format created_at timestamp to a readable date
  const dateObj = item.created_at ? new Date(item.created_at) : null;
  const postedAt =
    dateObj && !isNaN(dateObj)
      ? dateObj.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`soft-rise group relative overflow-hidden rounded-[14px] border border-slate-200/80 bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7f1d1d]/50 ${spanClass}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`Open announcement: ${item.title}`}
    >
      {item.image_url && (
        <div className="relative h-[120px] w-full bg-slate-100">
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-4">
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 backdrop-blur">
            <Flag size={12} />
            {item.priority}
          </span>
        </div>

        <header className="pr-16">
          <p className="m-0 inline-flex items-center gap-1 rounded-[8px] bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
            <Tag size={12} />
            {item.tag}
          </p>
          <h3 className="m-0 mt-3 line-clamp-2 text-[1.05rem] font-semibold leading-snug text-slate-900">
            {item.title}
          </h3>
        </header>

        <p className="m-0 mt-3 line-clamp-3 text-sm leading-relaxed text-slate-700">
          {item.excerpt}
        </p>

        <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-slate-500">
          {item.unit && (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span className="truncate">{item.unit}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} />
            {postedAt}
          </span>
        </footer>

        <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#7f1d1d] transition-colors group-hover:text-[#991b1b]">
          Open Notice
          <ArrowUpRight size={13} />
        </div>
      </div>
    </button>
  );
}

export default AnnouncementCard;
