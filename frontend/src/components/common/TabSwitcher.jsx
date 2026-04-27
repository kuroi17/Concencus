import { Megaphone, MessageSquare, Gavel } from "lucide-react";

const TABS = [
  { id: "announcement", label: "Announcement", icon: Megaphone },
  { id: "forum", label: "Forum", icon: MessageSquare },
  { id: "proposals", label: "Proposals", icon: Gavel },
];

/**
 * TabSwitcher — placed at the top of the <main> content area.
 * @param {string}   view          - "announcement" | "forum"
 * @param {Function} onChangeView  - setter callback
 */
function TabSwitcher({ view, onChangeView }) {
  return (
    <div className="max-w-full overflow-x-auto no-scrollbar">
      <div
        className="inline-flex min-w-max items-center gap-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 p-1.5 shadow-sm backdrop-blur-md ring-1 ring-slate-200/20 dark:ring-slate-800/20"
        role="tablist"
        aria-label="Content view switcher"
      >
        {TABS.map((tab) => {
        const isActive = view === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChangeView(tab.id)}
            className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-300 ${
              isActive
                ? "bg-[#800000] text-white shadow-lg shadow-red-900/20"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Icon size={16} className={isActive ? "text-amber-400 dark:text-amber-600" : "text-slate-400 dark:text-slate-500"} />
            {tab.label}
          </button>
        );
        })}
      </div>
    </div>
  );
}

export default TabSwitcher;
