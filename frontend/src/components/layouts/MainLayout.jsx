import React, { useState, createContext, useContext } from "react";
import ChannelSidebar from "../common/ChannelSidebar";
import Header from "../../common/Header";
import ChatWidget from "../ChatComponents/ChatWidget";

const LayoutContext = createContext();

export const useLayout = () => useContext(LayoutContext);

/**
 * MainLayout — Unified shell for the application.
 */
export default function MainLayout({ children, title, searchSlot, sidebarSlot, forceBackdrop = false }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeBackdrops, setActiveBackdrops] = useState({});

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const setGlobalBackdropVisible = (id, isVisible) => {
    if (!id) return;
    setActiveBackdrops((prev) => {
      if (isVisible) {
        return { ...prev, [id]: true };
      }
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const renderSidebar = (slot) => (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-[300px] flex-col border-r border-slate-200/60 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800/60 dark:bg-slate-950 lg:static lg:flex lg:h-screen lg:w-full lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {slot || (
          <div className="flex-1 p-6 text-center">
            <p className="text-sm text-slate-400">Select a discussion</p>
          </div>
        )}
      </aside>
    </>
  );

  const layoutValue = {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu: () => setIsMobileMenuOpen(false),
    setGlobalBackdropVisible
  };
  const hasGlobalBackdrop = forceBackdrop || Object.keys(activeBackdrops).length > 0;

  const renderContent = () => {
    // For chat page, show custom sidebar if provided
    if (title === "Communications") {
      return (
        <div className="flex h-screen bg-[#f3f5f8] dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[380px_1fr] overflow-hidden">
          {renderSidebar(sidebarSlot)}

          {/* Content Area */}
          <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
              <Header
                title={title}
                searchSlot={searchSlot}
                onMenuClick={toggleMobileMenu}
              />
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
      <div className={`flex h-screen bg-[#f3f5f8] dark:bg-slate-950 dark:text-slate-100 transition-all duration-300 ease-in-out lg:grid ${isSidebarCollapsed ? "lg:grid-cols-[80px_1fr]" : "lg:grid-cols-[280px_1fr]"} overflow-hidden`}>
        <div className={`fixed inset-y-0 left-0 z-[70] w-[280px] transition-transform duration-300 ease-in-out lg:static lg:block lg:w-full lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}>
          <ChannelSidebar
            collapsed={isSidebarCollapsed}
            onCollapseChange={setIsSidebarCollapsed}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Mobile Backdrop for default sidebar */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
          <div className="shrink-0 px-4 sm:px-6 lg:px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/60">
            <Header
              title={title}
              searchSlot={searchSlot}
              onMenuClick={toggleMobileMenu}
            />
          </div>

          <main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>

        <ChatWidget />
      </div>
    );
  };

  return (
    <LayoutContext.Provider value={layoutValue}>
      {renderContent()}
      {hasGlobalBackdrop && (
        <div className="pointer-events-none fixed inset-0 z-[95] bg-slate-900/60 backdrop-blur-md" />
      )}
    </LayoutContext.Provider>
  );
}
