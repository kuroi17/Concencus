import { Users, CircleDot, EyeOff } from "lucide-react";

const rules = [
  "Ensure relevance to the CS curriculum.",
  "Search existing threads before opening new topics.",
  "Maintain professional tone in all replies.",
  "Anonymous posting is allowed; logs remain protected.",
];

function ForumInfoPanel({ onOpenModal }) {
  return (
    <aside className="space-y-3" aria-label="Forum details">
      <section className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full rounded-[12px] bg-[#7f1d1d] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b]"
        >
          Start Discussion
        </button>

        <h3 className="m-0 mt-4 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900">
          About Channel
        </h3>
        <p className="m-0 mt-2 text-sm leading-relaxed text-slate-600">
          Community for curriculum concerns, governance feedback, and technical
          concerns for BS Computer Science.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} /> 1,204 Members
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={14} /> 14 Online
          </span>
        </div>
      </section>

      <section className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <h3 className="m-0 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900">
          Academic Posting Rules
        </h3>
        <ol className="m-0 mt-3 list-decimal space-y-1 pl-4 text-sm leading-relaxed text-slate-600">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <h3 className="m-0 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900">
          Anonymous Mode
        </h3>
        <p className="m-0 mt-2 inline-flex items-start gap-2 text-sm leading-relaxed text-slate-600">
          <EyeOff size={14} className="mt-0.5" />
          You can post anonymously for feedback-oriented topics while moderators
          retain protected logs.
        </p>
      </section>
    </aside>
  );
}

export default ForumInfoPanel;
