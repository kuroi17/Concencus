import { Plus, Network, Users, BookMarked, Scale, Archive } from "lucide-react";

const menuItems = [
  { label: "Organization", icon: Network },
  { label: "Committees", icon: Users },
  { label: "Policy Library", icon: BookMarked },
  { label: "Faculty Senate", icon: Scale },
  { label: "Archives", icon: Archive },
];

function ChatSidebar() {
  return (
    <aside
      className="border-b border-slate-200 px-[14px] py-4 sm:px-[18px] lg:border-b-0 lg:border-r"
      aria-label="Chat sidebar"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2 className="m-0 text-[1.65rem] font-extrabold leading-tight text-slate-900">
          Governance Tree
        </h2>
        <p className="m-0 mt-0.5 text-xs uppercase tracking-[0.09em] text-slate-500">
          Institutional Record
        </p>
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 bg-[#7f1d1d] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b]"
      >
        <Plus size={15} />
        <span>New Resolution</span>
      </button>

      <nav className="mt-5 space-y-1" aria-label="Chat sections">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Icon size={14} className="text-slate-500" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-slate-200 pt-4">
        <p className="m-0 text-sm font-semibold text-slate-900">
          Dr. A. Sterling
        </p>
        <p className="m-0 mt-0.5 text-xs text-slate-600">Chair, Block A</p>
      </div>
    </aside>
  );
}

export default ChatSidebar;
