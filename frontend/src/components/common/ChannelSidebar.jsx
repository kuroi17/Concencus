import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  LayoutGrid,
  Users,
} from "lucide-react";
import { useChannel } from "../../context/useChannel";
import SidebarLogoutAction from "../../common/SidebarLogoutAction";
import { useNavigate } from "react-router-dom";

const categoryIcons = {
  colleges: GraduationCap,
  programs: BookOpen,
  blocks: LayoutGrid,
  organizations: Users,
};

const categoryAccent = {
  colleges: "text-violet-600",
  programs: "text-sky-600",
  blocks: "text-emerald-600",
  organizations: "text-amber-600",
};

function ChannelSidebar({ collapsed = false, onCollapseChange }) {
  const { categories, currentChannel, setCurrentChannel, loadingChannels } =
    useChannel();
  const navigate = useNavigate();

  const [openCategories, setOpenCategories] = useState(() =>
    Object.fromEntries(
      ["colleges", "programs", "blocks", "organizations"].map((id) => [
        id,
        true,
      ]),
    ),
  );

  const toggleCategory = (id) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleCollapse = () => {
    if (onCollapseChange) onCollapseChange(!collapsed);
  };

  // ── Collapsed view (desktop only — mobile always shows full) ──
  if (collapsed) {
    return (
      <aside
        className="hidden lg:flex flex-col items-center border-r border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-950/90 py-6 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:overflow-x-hidden no-scrollbar transition-all duration-300"
        aria-label="Channel sidebar (collapsed)"
      >
        {/* Expand button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-110 active:scale-95 dark:bg-slate-100 dark:text-slate-900"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>

        {/* Category icon buttons */}
        <nav className="flex flex-1 flex-col items-center gap-4" aria-label="Channel categories">
          {loadingChannels ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-10 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
              ))}
            </div>
          ) : (
            categories.map((category) => {
              const Icon = categoryIcons[category.id] ?? Users;
              const hasActiveChild = category.channels.some(
                (ch) => currentChannel?.id === ch.id,
              );

              return (
                <div key={category.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (category.channels.length > 0) {
                        setCurrentChannel(category.channels[0]);
                        navigate("/hub");
                      }
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${
                      hasActiveChild
                        ? "bg-[#800000] text-white shadow-lg shadow-red-900/20"
                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title={category.label}
                    aria-label={category.label}
                  >
                    <Icon size={20} />
                  </button>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white dark:text-slate-900 opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                    {category.label}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* Logout (compact) */}
        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-3">
          <SidebarLogoutAction compact />
        </div>
      </aside>
    );
  }

  // ── Expanded view (full sidebar)
  return (
    <aside
      className="flex flex-col border-b border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-950/90 px-4 py-6 backdrop-blur-xl sm:px-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r no-scrollbar transition-all duration-300"
      aria-label="Channel sidebar"
    >
      {/* Brand + collapse toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            Channels
          </h2>
          {/* Collapse button — hidden on mobile */}
          {onCollapseChange && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
        <div className="mt-2 h-1 w-8 rounded-full bg-[#800000]" />
      </div>

      {/* Category accordion */}
      <nav className="flex-1 space-y-6" aria-label="Channel categories">
        {loadingChannels ? (
          /* Skeleton loader */
          <div className="space-y-6 px-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200/60 dark:bg-slate-800/60" />
                {[...Array(2)].map((__, j) => (
                  <div
                    key={j}
                    className="h-9 w-full animate-pulse rounded-xl bg-slate-100/60 dark:bg-slate-800/60"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          categories.map((category) => {
            const Icon = categoryIcons[category.id] ?? Users;
            const isOpen = openCategories[category.id] ?? true;

            return (
              <section key={category.id} className="space-y-2">
                {/* Category header / toggle */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="group flex w-full items-center justify-between px-1 py-1 text-left"
                  aria-expanded={isOpen}
                >
                  <span className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isOpen ? categoryAccent[category.id] || "text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>
                    <Icon size={14} className="transition-colors" />
                    {category.label}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-300 dark:text-slate-600 transition-transform duration-300 ${isOpen ? "" : "-rotate-90"}`}
                  />
                </button>

                {/* Channel items */}
                {isOpen && (
                  <ul className="space-y-1" role="list">
                    {category.channels.map((ch) => {
                      const isActive = currentChannel?.id === ch.id;
                      return (
                        <li key={ch.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentChannel(ch);
                              navigate("/hub");
                            }}
                            className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-300 ${
                              isActive
                                ? "bg-[#800000] text-white shadow-lg shadow-red-900/20 ring-1 ring-[#800000]"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                            title={ch.description}
                          >
                            <span className={`truncate ${isActive ? "font-bold" : "font-semibold"}`}>
                              {ch.name}
                            </span>
                            {isActive ? (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                            ) : (
                              <ChevronRight size={14} className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-slate-300 dark:text-slate-600" />
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
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 lg:mt-auto">
        <SidebarLogoutAction />
      </div>
    </aside>
  );
}

export default ChannelSidebar;
