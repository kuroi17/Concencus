import { useState } from "react";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Clock, CheckCircle2, Construction, XCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_CONFIG = {
  "Under Review": { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  "Approved": { icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  "Implemented": { icon: Construction, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Rejected": { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
};

function ProposalCard({ proposal, onVote, userVote, isAdmin, currentUserId, onStatusChange, onAddResponse, onDelete }) {
  const [showResponses, setShowResponses] = useState(false);
  const isAuthor = currentUserId === proposal.author_id;
  const canDelete = isAdmin || isAuthor;
  const status = STATUS_CONFIG[proposal.status] || STATUS_CONFIG["Under Review"];
  const StatusIcon = status.icon;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50">
      {/* Vote Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 flex w-12 flex-col items-center gap-1 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <button 
          onClick={() => onVote(proposal.id, 1)}
          className={`rounded-lg p-1 transition-all ${userVote === 1 ? "text-red-600 bg-red-100 dark:bg-red-900/30" : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"}`}
        >
          <ArrowBigUp size={24} fill={userVote === 1 ? "currentColor" : "none"} />
        </button>
        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{proposal.upvotes_count - proposal.downvotes_count}</span>
        <button 
          onClick={() => onVote(proposal.id, -1)}
          className={`rounded-lg p-1 transition-all ${userVote === -1 ? "text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700" : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`}
        >
          <ArrowBigDown size={24} fill={userVote === -1 ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="pl-16 p-6 space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${status.bg} dark:bg-slate-800 ${status.color} border ${status.border} dark:border-slate-700`}>
                <StatusIcon size={12} />
                {proposal.status}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {proposal.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-red-600 transition-colors">
              {proposal.title}
            </h3>
          </div>
          {proposal.sdg_tag && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
              {proposal.sdg_tag}
            </div>
          )}
          {canDelete && (
            <button 
              onClick={() => onDelete(proposal.id)}
              className="rounded-full p-2 text-slate-300 dark:text-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
              title="Delete Proposal"
            >
              <Trash2 size={16} />
            </button>
          )}
        </header>

        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
          {proposal.description}
        </p>

        <footer className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
            {proposal.is_anonymous ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <span className="text-[10px] text-slate-500">?</span>
              </div>
            ) : proposal.author_avatar ? (
              <img 
                src={proposal.author_avatar} 
                alt={proposal.author_name} 
                className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                <span className="text-[10px] uppercase">{proposal.author_name?.charAt(0) || "S"}</span>
              </div>
            )}
            <span>by {proposal.is_anonymous ? "Anonymous Student" : (proposal.author_name || "Student")}</span>
            <span>•</span>
            <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
          </div>
          
          <button 
            onClick={() => setShowResponses(!showResponses)}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${showResponses ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"}`}
          >
            <MessageCircle size={14} />
            {proposal.responses?.length || 0} Responses
            {showResponses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </footer>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-4 flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <select 
              value={proposal.status}
              onChange={(e) => onStatusChange(proposal.id, e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-red-600 dark:focus:border-red-400"
            >
              {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
              onClick={() => onAddResponse(proposal.id)}
              className="rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1 text-xs font-bold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors"
            >
              Add Official Response
            </button>
          </div>
        )}

        {/* Official Responses Section (Expandable) */}
        {showResponses && (
          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
            {proposal.responses && proposal.responses.length > 0 ? (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Official Admin Responses</p>
                {proposal.responses.map(res => (
                  <div key={res.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">{res.admin_name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(res.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic border-l-2 border-red-600 dark:border-red-500 pl-3">
                      "{res.body}"
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 text-center py-2 italic">No official responses yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProposalCard;
