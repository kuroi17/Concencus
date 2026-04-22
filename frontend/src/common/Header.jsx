import { NavLink } from "react-router-dom";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";

const defaultNavItems = [
  { to: "/hub", label: "Hub" },
  { to: "/chat", label: "Chat" },
  { to: "/profile", label: "Profile" },
];

function Header({ title = "Concensus", searchSlot = null }) {
  const { isAdmin } = useCurrentUserProfile();
  
  const navItems = isAdmin
    ? [...defaultNavItems, { to: "/admin", label: "Admin" }]
    : defaultNavItems;

  return (
    <header className="w-full transition-all duration-300">
      <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-[1.5rem] font-extrabold tracking-tight text-transparent sm:text-[1.85rem]">
            {title}
          </h1>
        </div>

        <nav
          className="flex items-center gap-1.5 rounded-2xl bg-slate-100/50 p-1.5 ring-1 ring-slate-200/50"
          aria-label="Primary Navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center rounded-[12px] px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-200 ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {searchSlot && <div className="pb-3 w-full">{searchSlot}</div>}
    </header>
  );
}

export default Header;
