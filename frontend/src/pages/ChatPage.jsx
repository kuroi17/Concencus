import Header from "../common/Header";
import ChatSidebar from "../components/ChatComponents/ChatSidebar";
import ChatThread from "../components/ChatComponents/ChatThread";

function ChatPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
      <ChatSidebar />

      <div className="flex flex-col gap-4">
        <Header />

        <main className="flex-1 py-2" role="main">
          <section className="border-t border-slate-200 pt-5">
            <ChatThread />
          </section>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
