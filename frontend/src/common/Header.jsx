import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/hub",     label: "Hub"     },
  { to: "/chat",    label: "Chat"    },
  { to: "/profile", label: "Profile" },
];

const navBaseClass =
  "rounded-[10px] px-3 py-2 text-base text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";
const navActiveClass = "bg-slate-100 text-slate-900";

function Header({ title = "Concensus", searchSlot = null }) {
  return (
    <header className="border-b border-slate-200/90 px-1 pb-3 pt-1 md:pb-4">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="w-full min-w-0 flex-1 md:w-auto">
          <h1 className="m-0 text-[1.35rem] font-semibold sm:text-[1.65rem]">
            {title}
          </h1>
        </div>

        <nav
          className="flex flex-wrap items-center gap-2 md:justify-end"
          aria-label="Primary Navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${navBaseClass} ${navActiveClass}` : navBaseClass
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {searchSlot && <div className="mt-3 w-full">{searchSlot}</div>}
    </header>
  );
}

export default Header;
