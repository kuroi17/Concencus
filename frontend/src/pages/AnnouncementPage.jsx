import AnnouncementBoard from "../components/AnnouncementComponents/AnnouncementBoard";
import AnnouncementSidebar from "../components/AnnouncementComponents/AnnouncementSidebar";
import Header from "../common/Header";

function AnnouncementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1540px] grid-cols-1 gap-3 xl:grid-cols-[290px_1fr] xl:items-start xl:gap-5">
        <AnnouncementSidebar />

        <div className="flex flex-col gap-4">
          <Header />

          <main className="soft-enter flex-1 py-2 sm:py-3" role="main">
            <section className="flex min-h-[540px] flex-col gap-5 bg-transparent p-0">
              <AnnouncementBoard />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementPage;
