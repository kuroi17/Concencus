import {
  Building2,
  ChevronRight,
  FolderTree,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

const groupHierarchy = [
  {
    label: "Admin Access",
    nodes: ["Student Affairs Office", "Registrar", "Campus Security"],
  },
  {
    label: "UPCS",
    nodes: ["College of Information and Computer Sciences", "Student Council"],
  },
  {
    label: "Any Orgs / Department",
    nodes: ["Academic Organizations", "Department Offices", "Support Units"],
  },
];

function AnnouncementSidebar() {
  return (
    <aside
      className="rounded-[18px] bg-white px-4 py-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:px-5"
      aria-label="Announcement Sidebar"
    >
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#7f1d1d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b]"
      >
        <Megaphone size={16} />
        <span>Post Announcement</span>
      </button>

      <div className="mt-5 rounded-[12px] border border-slate-200/80 bg-[#fbfcff] p-3.5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FolderTree size={16} />
          <span>Group Hierarchy</span>
        </div>

        <div className="space-y-3">
          {groupHierarchy.map((group) => (
            <section key={group.label} className="space-y-2">
              <h3 className="m-0 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <Building2 size={14} />
                {group.label}
              </h3>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {group.nodes.map((node) => (
                  <li key={node}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-[10px] px-2.5 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck size={14} />
                        {node}
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default AnnouncementSidebar;
