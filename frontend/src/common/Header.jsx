import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/announcements", label: "Announcement" },
  { to: "/forum", label: "Forum" },
  { to: "/chat", label: "Chat" },
];

const navBaseClass =
  "rounded-[10px] px-3 py-2 text-base text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";
const navActiveClass = "bg-slate-100 text-slate-900";

function Header() {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/90 px-1 pb-3 pt-1 md:flex-row md:items-center md:pb-4">
      <h1 className="m-0 text-[1.35rem] font-semibold sm:text-[1.65rem]">
        Concensus
      </h1>

      <nav
        className="flex flex-wrap items-center gap-2"
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
    </header>
  );
}

export default Header;
