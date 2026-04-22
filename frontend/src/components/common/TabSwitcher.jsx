import { Megaphone, MessageSquare } from "lucide-react";

const TABS = [
  { id: "announcement", label: "Announcement", icon: Megaphone },
  { id: "forum", label: "Forum", icon: MessageSquare },
];

/**
 * TabSwitcher — placed at the top of the <main> content area.
 * @param {string}   view          - "announcement" | "forum"
 * @param {Function} onChangeView  - setter callback
 */
function TabSwitcher({ view, onChangeView }) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/60 bg-white/50 p-1.5 shadow-sm backdrop-blur-md ring-1 ring-slate-200/20"
      role="tablist"
      aria-label="Content view switcher"
    >
      {TABS.map((tab) => {
        const isActive = view === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChangeView(tab.id)}
            className={`relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
              isActive
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <tab.icon size={16} className={isActive ? "text-amber-400" : "text-slate-400"} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default TabSwitcher;
