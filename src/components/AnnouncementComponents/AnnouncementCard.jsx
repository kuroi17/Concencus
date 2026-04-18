import {
  ArrowUpRight,
  CalendarDays,
  Flag,
  ShieldCheck,
  Tag,
  UserRound,
} from "lucide-react";

const cardSpanMap = {
  feature: "sm:col-span-8 xl:col-span-6 sm:row-span-3",
  wide: "sm:col-span-8 xl:col-span-6 sm:row-span-2",
  tall: "sm:col-span-4 xl:col-span-3 sm:row-span-3",
  standard: "sm:col-span-4 xl:col-span-3 sm:row-span-2",
};

function AnnouncementCard({ item }) {
  const spanClass = cardSpanMap[item.layout] || cardSpanMap.standard;
  const delay = item.delay || 0;

  return (
    <article
      className={`soft-rise relative overflow-hidden rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300 ${spanClass}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute right-3 top-3">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500"
        >
          <Flag size={12} />
          {item.priority}
        </button>
      </div>

      <header className="pr-16">
        <p className="m-0 inline-flex items-center gap-1 rounded-[8px] bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
          <Tag size={12} />
          {item.tag}
        </p>
        <h3 className="m-0 mt-3 text-[1.05rem] font-semibold leading-snug text-slate-900">
          {item.title}
        </h3>
      </header>

      <p className="m-0 mt-3 text-sm leading-relaxed text-slate-600">
        {item.excerpt}
      </p>

      <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={13} />
          {item.unit}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UserRound size={13} />
          {item.author}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} />
          {item.postedAt}
        </span>
      </footer>

      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#7f1d1d] transition-colors hover:text-[#991b1b]"
      >
        Open Notice
        <ArrowUpRight size={13} />
      </button>
    </article>
  );
}

export default AnnouncementCard;
