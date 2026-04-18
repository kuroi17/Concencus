import { Flame, Sparkles, TrendingUp, Search } from "lucide-react";
import ForumThread from "./ForumThread";

const filters = [
  { id: "hot", label: "Hot", icon: Flame, isActive: true },
  { id: "new", label: "New", icon: Sparkles, isActive: false },
  { id: "top", label: "Top", icon: TrendingUp, isActive: false },
];

const threadItems = [
  {
    id: "f-01",
    author: "Prof. A. Turing",
    timeAgo: "3 months ago",
    channel: "Announcement",
    title: "Welcome to the BSCS Forum. Mandatory reading before posting.",
    excerpt:
      "This space is governed by the university code of conduct. Ensure all technical questions are well-formed and include necessary context before requesting help.",
    comments: 24,
    score: 142,
  },
  {
    id: "f-02",
    author: "E. Lovelace",
    timeAgo: "4 hours ago",
    channel: "Curriculum",
    title: "Clarification needed on CS301 prerequisite changes for Fall term",
    excerpt:
      "The recent faculty memo indicated a shift in math prerequisites for Data Structures. Can an advisor confirm if discrete math is now required before enrollment?",
    comments: 12,
    score: 45,
  },
  {
    id: "f-03",
    author: "Anonymous",
    timeAgo: "6 hours ago",
    channel: "Feedback",
    title:
      "Concerns regarding the grading matrix for final projects in Networks",
    excerpt:
      "Submitting this anonymously to avoid bias. The rubric provided last week seems to heavily penalize creative implementations that deviate from the standard approach.",
    comments: 34,
    score: 28,
  },
];

function ForumBoard() {
  return (
    <section className="space-y-3" aria-label="Forum board">
      <div className="soft-enter flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                type="button"
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-sm transition-colors ${
                  filter.isActive
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={14} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full sm:max-w-[260px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search within channel..."
            className="w-full border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
          />
        </label>
      </div>

      <div className="space-y-3">
        {threadItems.map((item) => (
          <ForumThread key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default ForumBoard;
