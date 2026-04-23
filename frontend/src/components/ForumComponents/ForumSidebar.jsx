import { Network, Users, BookMarked, Scale } from "lucide-react";
import SidebarLogoutAction from "../../common/SidebarLogoutAction";

const channels = [
  { label: "Organization", icon: Network },
  { label: "Committees", icon: Users },
  { label: "Policy Library", icon: BookMarked },
  { label: "Faculty Senate", icon: Scale },
  { label: "Archives", icon: BookMarked },
];

function ForumSidebar() {
  return (
    <aside
      className="flex flex-col border-b border-slate-200 px-[14px] py-4 sm:px-[18px] lg:min-h-[calc(100vh-3rem)] lg:border-b-0 lg:border-r"
      aria-label="Forum sidebar"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2 className="m-0 text-[1.65rem] font-extrabold leading-tight text-slate-900">
          Governance Tree
        </h2>
        <p className="m-0 mt-0.5 text-xs uppercase tracking-[0.09em] text-slate-500">
          Institutional Record
        </p>
      </div>



      <nav className="mt-5 space-y-1" aria-label="Forum channels">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <button
              key={channel.label}
              type="button"
              className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Icon size={14} className="text-slate-500" />
              <span>{channel.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-slate-200 pt-4 lg:mt-auto">
        <SidebarLogoutAction />
      </div>
    </aside>
  );
}

export default ForumSidebar;
