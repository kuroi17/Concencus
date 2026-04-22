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
        className="hidden lg:flex flex-col items-center border-r border-slate-200 bg-white/70 py-4 backdrop-blur-sm lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto"
        aria-label="Channel sidebar (collapsed)"
      >
        {/* Expand button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="mb-4 flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>

        {/* Category icon buttons */}
        <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Channel categories">
          {loadingChannels ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-8 animate-pulse rounded-[8px] bg-slate-200" />
              ))}
            </div>
          ) : (
            categories.map((category) => {
              const Icon = categoryIcons[category.id] ?? Users;
              const accentCls = categoryAccent[category.id] ?? "text-slate-500";
              const hasActiveChild = category.channels.some(
                (ch) => currentChannel?.id === ch.id,
              );

              return (
                <div key={category.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      // When collapsed, clicking a category icon selects its first channel
                      if (category.channels.length > 0) {
                        setCurrentChannel(category.channels[0]);
                      }
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition-all ${
                      hasActiveChild
                        ? "bg-slate-900 text-white shadow-sm"
                        : `${accentCls} hover:bg-slate-100`
                    }`}
                    title={category.label}
                    aria-label={category.label}
                  >
                    <Icon size={16} />
                  </button>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[8px] bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {category.label}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* Logout (compact) */}
        <div className="mt-auto border-t border-slate-200 pt-3">
          <SidebarLogoutAction compact />
        </div>
      </aside>
    );
  }

  // ── Expanded view (full sidebar) ──
  return (
    <aside
      className="flex flex-col border-b border-slate-200 bg-white/70 px-3 py-4 backdrop-blur-sm sm:px-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r"
      aria-label="Channel sidebar"
    >
      {/* Brand + collapse toggle */}
      <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[1.55rem] font-extrabold leading-tight tracking-tight text-slate-900">
            Channels
          </h2>
          {/* Collapse button — hidden on mobile */}
          {onCollapseChange && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-[8px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
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
                  <div
                    key={j}
                    className="h-7 w-full animate-pulse rounded-[10px] bg-slate-100"
                  />
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
                  <span
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] ${accentCls}`}
                  >
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
                            <span className="truncate font-medium">
                              {ch.name}
                            </span>
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
