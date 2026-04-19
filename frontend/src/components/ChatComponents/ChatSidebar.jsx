import { Users } from "lucide-react";
import SidebarLogoutAction from "../../common/SidebarLogoutAction";

function ChatSidebar({
  currentUser,
}) {
  return (
    <aside
      className="flex flex-col border-b border-slate-200 px-[14px] py-4 sm:px-[18px] lg:min-h-[calc(100vh-3rem)] lg:border-b-0 lg:border-r"
      aria-label="Chat sidebar"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2 className="m-0 text-[1.65rem] font-extrabold leading-tight text-slate-900">
          Direct Messages
        </h2>
        <p className="m-0 mt-0.5 text-xs uppercase tracking-[0.09em] text-slate-500">
          Governance Correspondence
        </p>
      </div>

      <section className="mt-5 min-h-0 flex-1" aria-label="Followed profiles">
        <div className="mb-2 flex items-center gap-2">
          <Users size={14} className="text-slate-500" />
          <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Profiles
          </h3>
        </div>

        <div className="space-y-2 rounded-[12px] border border-dashed border-slate-300 bg-white p-3">
          <p className="m-0 text-xs text-slate-500">
            Follow feature is not yet enabled.
          </p>
          <p className="m-0 text-xs text-slate-500">
            Followed profiles will appear here once implemented.
          </p>
        </div>
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4">
        <p className="m-0 text-sm font-semibold text-slate-900">
          {currentUser?.full_name || "Authenticated User"}
        </p>
        <p className="m-0 mt-0.5 text-xs text-slate-600">
          {currentUser?.sr_code || "No SR Code"}
        </p>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4 lg:mt-auto">
        <SidebarLogoutAction />
      </div>
    </aside>
  );
}

export default ChatSidebar;
