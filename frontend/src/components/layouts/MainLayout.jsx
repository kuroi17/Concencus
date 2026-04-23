import { useState } from "react";
import ChannelSidebar from "../common/ChannelSidebar";
import Header from "../../common/Header";
import ChatWidget from "../ChatComponents/ChatWidget";

/**
 * MainLayout — Unified shell for the application.
 * Ensures the Sidebar and Header reach the absolute top of the viewport.
 */
export default function MainLayout({ children, title, searchSlot }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`grid min-h-screen grid-cols-1 items-start gap-0 bg-[#f3f5f8] dark:bg-slate-950 dark:text-slate-100 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[280px_1fr]"}`}>
      {/* Sidebar - Positioned at top-0 */}
      <ChannelSidebar 
        collapsed={isSidebarCollapsed} 
        onCollapseChange={setIsSidebarCollapsed} 
      />

      {/* Content Area */}
      <div className="flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header - Stays at top-0 */}
        <div className="shrink-0 px-4 sm:px-6 lg:px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60">
          <Header title={title} searchSlot={searchSlot} />
        </div>
        
        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Global Floating Chat */}
      <ChatWidget />
    </div>
  );
}
