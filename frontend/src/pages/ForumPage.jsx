import Header from "../common/Header";
import ForumBoard from "../components/ForumComponents/ForumBoard";
import ForumInfoPanel from "../components/ForumComponents/ForumInfoPanel";
import ForumSidebar from "../components/ForumComponents/ForumSidebar";

function ForumPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
      <ForumSidebar />

      <div className="flex flex-col gap-4">
        <Header />

        <main className="flex-1 py-2" role="main">
          <section className="space-y-4 border-t border-slate-200 pt-4 sm:pt-5">
            <header className="soft-enter">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                Undergraduate Programs
              </p>
              <h2 className="m-0 mt-1 text-[1.9rem] font-semibold leading-tight text-slate-900 sm:text-[2.25rem] lg:text-[2.55rem]">
                BS Computer Science
              </h2>
              <p className="m-0 mt-1 text-sm text-slate-600">
                Official channel for syllabus discussion, technical inquiries,
                and program governance.
              </p>
            </header>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
              <ForumBoard />
              <ForumInfoPanel />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ForumPage;
