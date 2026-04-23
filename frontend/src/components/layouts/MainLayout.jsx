import { useState } from "react";
import ChannelSidebar from "../common/ChannelSidebar";
import Header from "../../common/Header";
import ChatWidget from "../ChatComponents/ChatWidget";

/**
 * MainLayout — Unified shell for the application.
 */
export default function MainLayout({ children, title, searchSlot, sidebarSlot }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // For chat page, show custom sidebar if provided
  if (title === "Communications") {
    return (
      <div className="grid min-h-screen grid-cols-1 items-start gap-0 bg-[#f3f5f8] dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[380px_1fr]">
        {/* Sidebar */}
        <aside className="hidden flex-col border-r border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
          {sidebarSlot || (
            <div className="flex-1 p-6 text-center">
              <p className="text-sm text-slate-400">Select a discussion</p>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <div className="flex flex-col min-w-0 h-screen overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
            <Header title={title} searchSlot={searchSlot} />
          </div>

          <main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8 bg-[#f3f5f8] dark:bg-slate-950">
            {children}
          </main>
        </div>

        <ChatWidget />
      </div>
    );
  }

  return (
    <div className={`grid min-h-screen grid-cols-1 items-start gap-0 bg-[#f3f5f8] dark:bg-slate-950 dark:text-slate-100 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[280px_1fr]"}`}>
      <ChannelSidebar
        collapsed={isSidebarCollapsed}
        onCollapseChange={setIsSidebarCollapsed}
      />

      <div className="flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="shrink-0 px-4 sm:px-6 lg:px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60">
          <Header title={title} searchSlot={searchSlot} />
        </div>

        <main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
