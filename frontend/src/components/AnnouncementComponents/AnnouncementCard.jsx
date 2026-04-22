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
      className="break-inside-avoid mb-5 soft-rise group flex flex-col relative w-full overflow-hidden rounded-[24px] border border-slate-200/60 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/10"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`Open announcement: ${item.title}`}
    >
      {item.image_url && (
        <div className="relative h-[160px] w-full shrink-0 bg-slate-50">
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="p-6 flex flex-col w-full">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-200/50">
              {item.tag}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${getPriorityStyle(item.priority)} ring-1 ring-inset`}>
              <Flag size={10} />
              {item.priority}
            </span>
          </div>

          <h3 className="m-0 text-lg font-black leading-tight text-slate-900 group-hover:text-[#800000] transition-colors">
            {item.title}
          </h3>
        </header>

        <p className="m-0 mt-3 text-sm font-medium leading-relaxed text-slate-500 line-clamp-3">
          {item.excerpt}
        </p>

        <footer className="mt-6 space-y-4">
          <div className="h-px w-full bg-slate-100" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {item.unit && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#800000]" />
                {item.unit}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={12} />
              {postedAt}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#800000]">
            Full Notice
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </footer>
      </div>
    </button>
  );
}

export default AnnouncementCard;