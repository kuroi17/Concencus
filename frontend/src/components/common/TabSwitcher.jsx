import { Megaphone, MessageSquare } from "lucide-react";

const TABS = [
  { id: "announcement", label: "Announcement", icon: Megaphone },
  { id: "forum",        label: "Forum",      icon: MessageSquare },
];

/**
 * TabSwitcher — placed at the top of the <main> content area.
 * @param {string}   view          - "announcement" | "forum"
 * @param {Function} onChangeView  - setter callback
 */
function TabSwitcher({ view, onChangeView }) {
  return (
    <div
      className="inline-flex items-center rounded-[14px] border border-slate-200 bg-white p-1 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
      role="tablist"
      aria-label="Content view switcher"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = view === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChangeView(id)}
            className={`inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default TabSwitcher;
