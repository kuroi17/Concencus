import { NavLink } from "react-router-dom";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, Menu } from "lucide-react";

const defaultNavItems = [
  { to: "/hub", label: "Hub" },
  { to: "/chat", label: "Chat" },
  { to: "/transparency", label: "Transparency" }
];

function Header({ title = "Concensus", searchSlot = null, onMenuClick }) {
  const { profile } = useCurrentUserProfile();
  const { theme, toggleTheme } = useTheme();

  const navItems =
    profile?.campus_role === "admin"
      ? [...defaultNavItems, { to: "/admin", label: "Admin" }]
      : defaultNavItems;

  return (
    <header className="w-full transition-all duration-300">
      <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
         
        </div>

          {/* Navigation & Search Slot */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 min-w-0">
            {searchSlot && (
              <div className="hidden 2xl:block w-full max-w-sm shrink-0">
                {searchSlot}
              </div>
            )}

            <nav
              className="flex max-w-full items-center gap-1 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 p-1 ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-x-auto no-scrollbar"
              aria-label="Primary Navigation"
            >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center rounded-[12px] px-3 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-200 dark:ring-slate-600"
                      : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white ml-2"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile Avatar */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition-all ${
                isActive
                  ? "border-[#800000] shadow-lg shadow-red-900/20"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
              }`
            }
          >
            {profile?.avatar_url ? (
              <img
                src={`${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}`}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                ME
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {searchSlot && <div className="2xl:hidden pb-3 w-full">{searchSlot}</div>}
    </header>
  );
}

export default Header;
