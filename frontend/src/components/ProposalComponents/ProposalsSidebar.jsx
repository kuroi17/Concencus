import { Gavel, History, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import SidebarLogoutAction from "../../common/SidebarLogoutAction";

const sections = [
  { label: "Active Proposals", icon: Gavel },
  { label: "Implemented", icon: CheckCircle2 },
  { label: "Under Review", icon: History },
  { label: "Rejected", icon: AlertCircle },
];

function ProposalsSidebar({ onOpenModal }) {
  return (
    <aside
      className="flex flex-col border-b border-slate-200 px-[14px] py-4 sm:px-[18px] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:border-b-0 lg:border-r"
      aria-label="Proposals sidebar"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2 className="m-0 text-[1.65rem] font-extrabold leading-tight text-slate-900">
          Governance
        </h2>
        <p className="m-0 mt-0.5 text-xs uppercase tracking-[0.09em] text-slate-500">
          Proposals & Voting
        </p>
      </div>

      <div className="mt-5">
        <button
          onClick={onOpenModal}
          className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#7f1d1d] py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition-all hover:bg-[#991b1b] active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>New Proposal</span>
        </button>
      </div>

      <nav className="mt-6 space-y-1" aria-label="Proposal categories">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.label}
              type="button"
              className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Icon size={14} className="text-slate-500" />
              <span>{section.label}</span>
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

export default ProposalsSidebar;
