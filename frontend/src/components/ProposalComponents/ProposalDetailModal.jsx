import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, ArrowBigUp, ArrowBigDown, MessageCircle,
  Clock, CheckCircle2, Construction, XCircle, Trash2,
  CalendarDays, User, ShieldCheck, Tag,
} from "lucide-react";
import SDGBadge from "../common/SDGBadge";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useLayout } from "../layouts/MainLayout";

const STATUS_CONFIG = {
  "Under Review": {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-700/40",
    dot: "bg-amber-400",
    accentBar: "from-amber-400 to-amber-300",
  },
  "Approved": {
    icon: CheckCircle2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700/40",
    dot: "bg-blue-500",
    accentBar: "from-blue-500 to-blue-400",
  },
  "Implemented": {
    icon: Construction,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700/40",
    dot: "bg-emerald-500",
    accentBar: "from-emerald-500 to-emerald-400",
  },
  "Rejected": {
    icon: XCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-700/40",
    dot: "bg-rose-500",
    accentBar: "from-rose-500 to-rose-400",
  },
};

const CATEGORY_CONFIG = {
  Academic:   { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800/40" },
  Facilities: { bg: "bg-sky-100 dark:bg-sky-900/30",    text: "text-sky-700 dark:text-sky-300",    border: "border-sky-200 dark:border-sky-800/40" },
  Policy:     { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800/40" },
};

function AuthorAvatar({ proposal, size = 10 }) {
  if (proposal.is_anonymous) {
    return (
      <div className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold text-sm`}>?</div>
    );
  }
  if (proposal.author_avatar) {
    return <img src={proposal.author_avatar} alt={proposal.author_name} className={`h-${size} w-${size} shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800`} />;
  }
  return (
    <div className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#800000] to-[#b00000] text-white font-black uppercase text-sm`}>
      {proposal.author_name?.charAt(0) || "S"}
    </div>
  );
}

function ProposalDetailModal({
  isOpen, onClose, proposal,
  onVote, userVote, isAdmin, currentUserId,
  onStatusChange, onAddResponse, onDelete,
}) {
  const { setGlobalBackdropVisible } = useLayout();

  useEscapeKey(Boolean(isOpen && proposal), onClose);

  useEffect(() => {
    setGlobalBackdropVisible("proposal-detail-modal", Boolean(isOpen && proposal));
    return () => setGlobalBackdropVisible("proposal-detail-modal", false);
  }, [isOpen, proposal, setGlobalBackdropVisible]);

  if (!isOpen || !proposal) return null;

  const isAuthor = currentUserId === proposal.author_id;
  const canDelete = isAdmin || isAuthor;
  const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG["Under Review"];
  const StatusIcon = status.icon;
  const catStyle = CATEGORY_CONFIG[proposal.category] || CATEGORY_CONFIG["Academic"];
  const netVotes = (proposal.upvotes_count ?? 0) - (proposal.downvotes_count ?? 0);

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Gradient accent header */}
        <div className={`relative h-1.5 w-full bg-gradient-to-r ${status.accentBar} shrink-0`} />

        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <StatusIcon size={10} />
              {proposal.status}
            </span>
            {/* Category badge */}
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
              {proposal.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            {canDelete && (
              <button
                onClick={() => { onDelete(proposal.id); onClose(); }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition-all"
                title="Delete proposal"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-5">

          {/* Title */}
          <h2 className="text-xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            {proposal.title}
          </h2>

          {/* Author + date row */}
          <div className="flex items-center gap-3">
            <AuthorAvatar proposal={proposal} size={9} />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {proposal.is_anonymous ? "Anonymous Student" : (proposal.author_name || "Student")}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(proposal.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Vote bar */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
            <button
              onClick={() => onVote(proposal.id, 1)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${userVote === 1 ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
            >
              <ArrowBigUp size={18} strokeWidth={userVote === 1 ? 0 : 1.5} fill={userVote === 1 ? "currentColor" : "none"} />
              Upvote
            </button>
            <span className={`text-lg font-black tabular-nums ${netVotes > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
              {netVotes > 0 ? "+" : ""}{netVotes}
            </span>
            <button
              onClick={() => onVote(proposal.id, -1)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${userVote === -1 ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <ArrowBigDown size={18} strokeWidth={userVote === -1 ? 0 : 1.5} fill={userVote === -1 ? "currentColor" : "none"} />
              Downvote
            </button>
            <div className="ml-auto flex items-center gap-1.5 text-slate-400">
              <MessageCircle size={14} />
              <span className="text-xs font-bold">{proposal.responses?.length || 0} response{proposal.responses?.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

          {/* Description */}
          <div>
            <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Proposal</h3>
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              {proposal.description}
            </p>
          </div>

          {/* SDG Tags */}
          {proposal.sdg_tags?.length > 0 && (
            <div>
              <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">SDG Alignment</h3>
              <div className="flex flex-wrap gap-1.5">
                {proposal.sdg_tags.map(id => <SDGBadge key={id} sdgId={id} />)}
              </div>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Admin Controls</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={proposal.status}
                  onChange={(e) => onStatusChange(proposal.id, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#800000] transition-colors"
                >
                  {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={() => onAddResponse(proposal.id)}
                  className="rounded-xl bg-[#800000] px-4 py-2 text-sm font-bold text-white hover:bg-[#a00000] transition-colors shadow-md shadow-red-900/20"
                >
                  Add Response
                </button>
              </div>
            </div>
          )}

          {/* Official Responses */}
          <div>
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Official Responses ({proposal.responses?.length || 0})
            </h3>
            <div className="space-y-3">
              {proposal.responses?.length > 0 ? (
                proposal.responses.map(res => (
                  <div key={res.id} className="relative rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 pl-5 overflow-hidden">
                    {/* Left accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#800000]" />
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#800000] dark:text-red-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">{res.admin_name || "Admin"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(res.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {res.body}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 py-8">
                  <MessageCircle size={24} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500">No official responses yet</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

export default ProposalDetailModal;
