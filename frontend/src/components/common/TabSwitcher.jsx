import { Megaphone, MessageSquare, Gavel } from "lucide-react";

const TABS = [
  { id: "announcement", label: "Announcements", shortLabel: "News",      icon: Megaphone },
  { id: "forum",        label: "Forum",         shortLabel: "Forum",     icon: MessageSquare },
  { id: "proposals",   label: "Proposals",     shortLabel: "Proposals", icon: Gavel },
];

function TabSwitcher({ view, onChangeView }) {
  return (
    <div className="max-w-full overflow-x-auto no-scrollbar">
      <div
        className="inline-flex min-w-max items-center gap-1 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-1.5 shadow-sm"
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
              className={`relative inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-[#800000] text-white shadow-md shadow-red-900/25"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon
                size={14}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-red-200" : ""}
              />
              {/* Short label on xs, full label on sm+ */}
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TabSwitcher;
