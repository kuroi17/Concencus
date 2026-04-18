import AnnouncementChannelTabs from "../components/AnnouncementComponents/AnnouncementChannelTabs";
import AnnouncementBoard from "../components/AnnouncementComponents/AnnouncementBoard";
import AnnouncementSidebar from "../components/AnnouncementComponents/AnnouncementSidebar";
import Header from "../common/Header";

function AnnouncementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
        <AnnouncementSidebar />

        <div className="flex flex-col gap-4">
          <Header />

          <main
            className="flex-1 rounded-[18px] bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:p-5"
            role="main"
          >
            <section className="flex min-h-[540px] flex-col gap-4 rounded-[14px] bg-[#f7f9fd] p-4 sm:p-5">
              <AnnouncementChannelTabs />
              <AnnouncementBoard />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementPage;
