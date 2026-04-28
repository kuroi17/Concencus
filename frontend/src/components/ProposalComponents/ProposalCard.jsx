import { ArrowBigUp, ArrowBigDown, MessageCircle, Clock, CheckCircle2, Construction, XCircle, Trash2, CalendarDays, User } from "lucide-react";
import SDGBadge from "../common/SDGBadge";

const STATUS_CONFIG = {
  "Under Review": {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800/40",
    accent: "bg-amber-400",
    dot: "bg-amber-400",
  },
  "Approved": {
    icon: CheckCircle2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/40",
    accent: "bg-blue-500",
    dot: "bg-blue-500",
  },
  "Implemented": {
    icon: Construction,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    accent: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  "Rejected": {
    icon: XCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800/40",
    accent: "bg-rose-500",
    dot: "bg-rose-500",
  },
};

const CATEGORY_CONFIG = {
  Academic:   { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800/40" },
  Facilities: { bg: "bg-sky-100 dark:bg-sky-900/30",    text: "text-sky-700 dark:text-sky-300",    border: "border-sky-200 dark:border-sky-800/40" },
  Policy:     { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800/40" },
};

function AuthorChip({ proposal }) {
  if (proposal.is_anonymous) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold">?</div>
    );
  }
  if (proposal.author_avatar) {
    return <img src={proposal.author_avatar} alt={proposal.author_name} className="h-7 w-7 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" />;
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#800000] to-[#b00000] text-white text-[10px] font-black uppercase">
      {proposal.author_name?.charAt(0) || "S"}
    </div>
  );
}

function ProposalCard({ proposal, onVote, userVote, isAdmin, currentUserId, onStatusChange, onAddResponse, onDelete, onOpen }) {
  const isAuthor = currentUserId === proposal.author_id;
  const canDelete = isAdmin || isAuthor;
  const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG["Under Review"];
  const StatusIcon = status.icon;
  const catStyle = CATEGORY_CONFIG[proposal.category] || CATEGORY_CONFIG["Academic"];
  const netVotes = (proposal.upvotes_count ?? 0) - (proposal.downvotes_count ?? 0);

  return (
    <article
      onClick={onOpen}
      className="group relative flex cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/40 hover:border-slate-300 dark:hover:border-slate-700"
    >
      {/* Status accent bar */}
      <div className={`w-1 shrink-0 ${status.accent} transition-all group-hover:w-1.5`} />

      {/* Vote column */}
      <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-800/30 py-5">
        <button
          onClick={(e) => { e.stopPropagation(); onVote(proposal.id, 1); }}
          className={`rounded-lg p-1 transition-all ${userVote === 1 ? "text-red-600 bg-red-100 dark:bg-red-900/40" : "text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
        >
          <ArrowBigUp size={20} strokeWidth={userVote === 1 ? 0 : 1.5} fill={userVote === 1 ? "currentColor" : "none"} />
        </button>
        <span className={`text-xs font-black tabular-nums transition-colors ${netVotes > 0 ? "text-red-600 dark:text-red-400" : netVotes < 0 ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
          {netVotes}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onVote(proposal.id, -1); }}
          className={`rounded-lg p-1 transition-all ${userVote === -1 ? "text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700" : "text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
        >
          <ArrowBigDown size={20} strokeWidth={userVote === -1 ? 0 : 1.5} fill={userVote === -1 ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-3 p-4 min-w-0">
        {/* Top row: status + category + delete */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {proposal.status}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {proposal.category}
          </span>
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(proposal.id); }}
              className="ml-auto rounded-full p-1.5 text-slate-200 dark:text-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white group-hover:text-[#800000] dark:group-hover:text-red-400 transition-colors line-clamp-2">
          {proposal.title}
        </h3>

        {/* Description */}
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 flex-1">
          {proposal.description}
        </p>

        {/* SDG tags (max 3) */}
        {proposal.sdg_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {proposal.sdg_tags.slice(0, 3).map(id => <SDGBadge key={id} sdgId={id} />)}
            {proposal.sdg_tags.length > 3 && (
              <span className="text-[9px] font-black text-slate-400 self-center">+{proposal.sdg_tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <AuthorChip proposal={proposal} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {proposal.is_anonymous ? "Anonymous Student" : (proposal.author_name || "Student")}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                {new Date(proposal.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#800000] dark:hover:text-red-400 transition-colors shrink-0"
          >
            <MessageCircle size={12} />
            <span>{proposal.responses?.length || 0}</span>
          </button>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <select
              value={proposal.status}
              onChange={(e) => { e.stopPropagation(); onStatusChange(proposal.id, e.target.value); }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#800000] transition-colors"
            >
              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={(e) => { e.stopPropagation(); onAddResponse(proposal.id); }}
              className="shrink-0 rounded-lg bg-slate-900 dark:bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-white dark:text-slate-900 hover:bg-slate-800 transition-colors"
            >
              Respond
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default ProposalCard;
