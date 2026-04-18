import Header from '../common/Header'

function ChatPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
      <aside
        className="min-h-[72px] border-b border-slate-200 px-[18px] py-[22px] font-medium text-slate-600 lg:border-b-0 lg:border-r"
        aria-label="Sidebar"
      >
        <span>Sidebar</span>
      </aside>

      <div className="flex flex-col gap-4">
        <Header />

        <main className="flex-1 py-2" role="main">
          <section className="min-h-[280px] border-t border-slate-200 pt-5">
            <h2 className="m-0 text-[1.6rem] font-semibold">Chat Page</h2>
            <p className="mt-[10px] leading-relaxed text-[#333333]">
              Minimal placeholder for conversations and message threads.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default ChatPage
