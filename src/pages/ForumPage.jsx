import Header from '../common/Header'

function ForumPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
      <aside
        className="min-h-[72px] rounded-[18px] bg-white px-[18px] py-[22px] font-medium text-slate-600 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
        aria-label="Sidebar"
      >
        <span>Sidebar</span>
      </aside>

      <div className="flex flex-col gap-4">
        <Header />

        <main
          className="flex-1 rounded-[18px] bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
          role="main"
        >
          <section className="min-h-[280px] rounded-[14px] bg-[#fbfcff] p-5">
            <h2 className="m-0 text-[1.6rem] font-semibold">Forum Page</h2>
            <p className="mt-[10px] leading-relaxed text-[#333333]">
              Minimal placeholder for topics, posts, and threaded replies.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default ForumPage
