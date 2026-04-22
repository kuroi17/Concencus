import {
  ArrowUpRight,
  CalendarDays,
  Flag,
  ShieldCheck,
  Tag,
  UserRound 
} from "lucide-react";

// Mga Priority Colors para mas maganda tingnan (To feel the urgency)
const getPriorityStyle = (priorityText) => {
  if (!priorityText) return "bg-slate-100 text-slate-600 border-slate-200"; // Default

  const p = priorityText.trim().toLowerCase();

  if (p.includes("urgent")) return "bg-red-100 text-red-700 border-red-200";
  if (p.includes("important")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (p.includes("fyi") || p.includes("notice")) return "bg-emerald-100 text-emerald-700 border-emerald-200";

  return "bg-slate-100 text-slate-600 border-slate-200"; // Para sa "Normal"
};

function AnnouncementCard({ item, delay = 0, onOpen }) {
  // Ligtas at perfect na Date Formatter mo
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
      className="break-inside-avoid mb-4 soft-rise group flex flex-col relative w-full overflow-hidden rounded-[14px] border border-slate-200/80 bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7f1d1d]/50"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`Open announcement: ${item.title}`}
    >
      
      {item.image_url && (
        <div className="relative h-[120px] w-full shrink-0 bg-slate-100">
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
        </div>
      )}

      {/* ── Content Container ── */}
      <div className="p-4 flex flex-col w-full">
        
        <header className="flex flex-col gap-2.5">
          <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
            
            {/* TAG: Nilagyan ng shrink at truncate. Kung masikip, siya ang mapuputol nang may ellipsis (...) */}
            <span className="m-0 inline-flex min-w-0 shrink items-center gap-1 rounded-[8px] bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
              <Tag size={12} className="shrink-0" />
              <span className="truncate">{item.tag}</span>
            </span>

            {/* PRIORITY: Nilagyan ng shrink-0 para bawal paliitin. Laging buo ang basa! */}
            <span className={`m-0 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${getPriorityStyle(item.priority)}`}>
              <Flag size={12} />
              {item.priority}
            </span>
          </div>

          <h3 className="m-0 mt-1 line-clamp-2 text-[1.05rem] font-semibold leading-snug text-slate-900">
            {item.title}
          </h3>
        </header>

        {/* 🚀 MAGIC 3: Bulletproof 3-line limit. Kapag maikli, aakyat ang ilalim. Kapag mahaba, cut sa 3! */}
        <p 
          className="m-0 mt-3 text-sm leading-relaxed text-slate-700"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {item.excerpt}
        </p>

        {/* ── Footer ── */}
        <footer className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-slate-500">
          {item.unit && (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span className="truncate">{item.unit}</span>
            </span>
          )}
          {item.author && (
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={13} />
              <span className="truncate">{item.author}</span>
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