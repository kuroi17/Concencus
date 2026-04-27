import { NavLink } from "react-router-dom";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, Menu, Megaphone, MessageSquare, Vote, BarChart3, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { to: "/hub",          label: "Hub",           icon: Megaphone },
  { to: "/chat",         label: "Chat",          icon: MessageSquare },
  { to: "/transparency", label: "Transparency",  icon: BarChart3 },
];

const ADMIN_ITEM = { to: "/admin", label: "Admin", icon: ShieldCheck };

function Header({ title = "Concensus", searchSlot = null, onMenuClick }) {
  const { profile } = useCurrentUserProfile();
  const { theme, toggleTheme } = useTheme();

  const navItems =
    profile?.campus_role === "admin"
      ? [...NAV_ITEMS, ADMIN_ITEM]
      : NAV_ITEMS;

  return (
    <header className="w-full transition-all duration-300">
      <div className="flex items-center gap-3 py-3 min-w-0">

        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Search slot on desktop */}
        {searchSlot && (
          <div className="hidden 2xl:block w-full max-w-sm shrink">
            {searchSlot}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nav pill */}
        <nav
          className="flex items-center gap-0.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 p-1 ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-x-auto no-scrollbar"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex shrink-0 items-center gap-1.5 rounded-[14px] px-3 py-2 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                      : "text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User avatar */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 transition-all ${
              isActive
                ? "border-[#800000] shadow-lg shadow-red-900/20 ring-2 ring-[#800000]/20"
                : "border-slate-200 dark:border-slate-700 hover:border-[#800000]/40 dark:hover:border-[#800000]/40"
            }`
          }
          aria-label="My profile"
        >
          {profile?.avatar_url ? (
            <img
              src={`${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}`}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#800000] to-[#b00000] text-[10px] font-black text-white">
              {profile?.full_name?.split(" ").slice(0,2).map(w => w[0]).join("") || "ME"}
            </div>
          )}
        </NavLink>
      </div>

      {/* Mobile search */}
      {searchSlot && <div className="2xl:hidden pb-3 w-full">{searchSlot}</div>}
    </header>
  );
}

export default Header;
