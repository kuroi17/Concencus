import { NavLink } from "react-router-dom";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

const defaultNavItems = [
  { to: "/hub", label: "Hub" },
  { to: "/chat", label: "Chat" },
  { to: "/transparency", label: "Transparency" },
  { to: "/profile", label: "Profile" },
];

function Header({ title = "Concensus", searchSlot = null }) {
  const { profile } = useCurrentUserProfile();
  const { theme, toggleTheme } = useTheme();

  const navItems =
    profile?.campus_role === "admin"
      ? [...defaultNavItems, { to: "/admin", label: "Admin" }]
      : defaultNavItems;

  return (
    <header className="w-full transition-all duration-300">
      <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-[1.5rem] font-extrabold tracking-tight text-transparent sm:text-[1.85rem]">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Navigation */}
          <nav
            className="flex items-center gap-1.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 p-1.5 ring-1 ring-slate-200/50 dark:ring-slate-700/50"
            aria-label="Primary Navigation"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center rounded-[12px] px-4 py-2 text-sm font-bold transition-all duration-200 ${
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
         
        </div>
      </div>

      {searchSlot && <div className="pb-3 w-full">{searchSlot}</div>}
    </header>
  );
}

export default Header;
