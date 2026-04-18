import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/announcements', label: 'Announcement' },
  { to: '/forum', label: 'Forum' },
  { to: '/chat', label: 'Chat' },
]

const navBaseClass =
  'rounded-[10px] px-3 py-2 text-base text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900'
const navActiveClass = 'bg-slate-100 text-slate-900'

function AnnouncementPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
      <aside
        className="min-h-[72px] rounded-[18px] bg-white px-[18px] py-[22px] font-medium text-slate-600 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
        aria-label="Sidebar"
      >
        <span>Sidebar</span>
      </aside>

      <div className="flex flex-col gap-4">
        <header className="flex flex-col items-start justify-between gap-4 rounded-[18px] bg-white px-5 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)] md:flex-row md:items-center">
          <h1 className="m-0 text-[1.35rem] font-semibold sm:text-[1.65rem]">Concensus</h1>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Primary Navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? `${navBaseClass} ${navActiveClass}`
                    : navBaseClass
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main
          className="flex-1 rounded-[18px] bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
          role="main"
        >
          <section className="min-h-[280px] rounded-[14px] bg-[#fbfcff] p-5">
            <h2 className="m-0 text-[1.6rem] font-semibold">Announcement Page</h2>
            <p className="mt-[10px] leading-relaxed text-[#333333]">
              Minimal placeholder for announcements, events, and school updates.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default AnnouncementPage
