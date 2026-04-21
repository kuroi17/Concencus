import { useState } from "react";
import { ChevronDown, GraduationCap, BookOpen, LayoutGrid, Users } from "lucide-react";
import { useChannel } from "../../context/ChannelContext";
import SidebarLogoutAction from "../../common/SidebarLogoutAction";

const categoryIcons = {
  colleges:      GraduationCap,
  programs:      BookOpen,
  blocks:        LayoutGrid,
  organizations: Users,
};

const categoryAccent = {
  colleges:      "text-violet-600",
  programs:      "text-sky-600",
  blocks:        "text-emerald-600",
  organizations: "text-amber-600",
};

function ChannelSidebar() {
  const { categories, currentChannel, setCurrentChannel, loadingChannels } = useChannel();

  const [openCategories, setOpenCategories] = useState(() =>
    Object.fromEntries(
      ["colleges", "programs", "blocks", "organizations"].map((id) => [id, true]),
    ),
  );

  const toggleCategory = (id) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside
      className="flex flex-col border-b border-slate-200 bg-white/70 px-3 py-4 backdrop-blur-sm sm:px-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r"
      aria-label="Channel sidebar"
    >
      {/* Brand */}
      <div className="mb-5 border-b border-slate-200 pb-4">
        <h2 className="m-0 text-[1.55rem] font-extrabold leading-tight tracking-tight text-slate-900">
          Channels
        </h2>
        <p className="m-0 mt-0.5 text-xs uppercase tracking-[0.09em] text-slate-400">
          Select a channel to filter
        </p>
      </div>

      {/* Category accordion */}
      <nav className="flex-1 space-y-2" aria-label="Channel categories">
        {loadingChannels ? (
          /* Skeleton loader */
          <div className="space-y-3 px-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                {[...Array(2)].map((__, j) => (
                  <div key={j} className="h-7 w-full animate-pulse rounded-[10px] bg-slate-100" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          categories.map((category) => {
            const Icon = categoryIcons[category.id] ?? Users;
            const accentCls = categoryAccent[category.id] ?? "text-slate-500";
            const isOpen = openCategories[category.id] ?? true;

            return (
              <section key={category.id}>
                {/* Category header / toggle */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-slate-100"
                  aria-expanded={isOpen}
                >
                  <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] ${accentCls}`}>
                    <Icon size={13} />
                    {category.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
                  />
                </button>

                {/* Channel items */}
                {isOpen && (
                  <ul className="mt-1 space-y-0.5 pl-1" role="list">
                    {category.channels.map((ch) => {
                      const isActive = currentChannel?.id === ch.id;
                      return (
                        <li key={ch.id}>
                          <button
                            type="button"
                            onClick={() => setCurrentChannel(ch)}
                            className={`flex w-full items-center justify-between gap-2 rounded-[10px] px-2.5 py-1.5 text-left text-sm transition-all ${
                              isActive
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                            title={ch.description}
                          >
                            <span className="truncate font-medium">{ch.name}</span>
                            {isActive && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </nav>

      {/* Logout */}
      <div className="mt-6 border-t border-slate-200 pt-4 lg:mt-auto">
        <SidebarLogoutAction />
      </div>
    </aside>
  );
}

export default ChannelSidebar;
