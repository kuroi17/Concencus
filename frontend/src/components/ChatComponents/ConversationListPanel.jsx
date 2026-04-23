import { MessageCircleMore, Search, X } from "lucide-react";
import { useLayout } from "../layouts/MainLayout";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatTimestamp(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatUnread(count) {
  if (!count || count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-0.5 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationListPanel({
  conversations,
  isLoadingConversations,
  onOpenConversation,
  activeConversationId,
  unreadCounts,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearchingProfiles,
  isOpeningConversation,
  onSelectSearchResult,
}) {
  const { closeMobileMenu } = useLayout();
  const hasSearchText = searchQuery.trim().length >= 2;

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable Content */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        {hasSearchText ? (
          <div className="p-2">
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              People
            </p>

            {isSearchingProfiles && (
              <p className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                Searching…
              </p>
            )}

            {!isSearchingProfiles && searchResults.length === 0 && (
              <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                No results for &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {!isSearchingProfiles &&
              searchResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onSelectSearchResult(profile);
                  }}
                  disabled={isOpeningConversation}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800">
                    {profile.avatar_url ? (
                      <img
                        src={`${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800 dark:bg-slate-700 text-xs font-semibold text-white">
                        {getInitials(profile.full_name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {profile.full_name}
                    </p>
                    <p className="m-0 truncate text-xs text-slate-500 dark:text-slate-400">
                      {profile.sr_code || "No SR Code"}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        ) : (
          <>
            {isLoadingConversations && <LoadingSkeleton />}

            {!isLoadingConversations && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <MessageCircleMore
                  size={36}
                  className="mb-3 text-slate-300 dark:text-slate-700"
                />
                <p className="m-0 text-sm font-medium text-slate-500 dark:text-slate-400">
                  No conversations yet
                </p>
                <p className="m-0 mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Search for someone above to start chatting
                </p>
              </div>
            )}

            <div className="space-y-0.5 p-2">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                const unread = unreadCounts?.get(conversation.id) || 0;
                const badge = formatUnread(unread);
                const latestTs = conversation.latestMessage?.created_at;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenConversation(conversation.id);
                    }}
                    className={`group flex w-full items-center gap-3.5 rounded-[22px] px-3.5 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 dark:bg-white dark:text-slate-900"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`h-12 w-12 overflow-hidden rounded-[18px] border-2 transition-transform duration-300 group-hover:scale-105 ${isActive ? "border-slate-800 dark:border-white/20" : "border-white dark:border-slate-800"} bg-white shadow-sm dark:bg-slate-900`}>
                        {conversation.otherUser?.avatar_url ? (
                          <img
                            src={`${conversation.otherUser.avatar_url}${conversation.otherUser.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center text-[15px] font-black ${isActive ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                            {getInitials(conversation.otherUser?.full_name)}
                          </div>
                        )}
                      </div>

                      {badge && (
                        <span className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white ring-2 ${isActive ? "bg-[#800000] ring-slate-900 dark:ring-white" : "bg-[#800000] ring-white dark:ring-slate-900"}`}>
                          {badge}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`m-0 truncate text-[14px] font-bold leading-tight ${isActive ? "text-white dark:text-slate-900" : "text-slate-900 dark:text-slate-100"}`}>
                          {conversation.otherUser?.full_name || "Unknown User"}
                        </p>

                        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider ${isActive ? "text-slate-400 dark:text-slate-500" : "text-slate-400"}`}>
                          {formatTimestamp(latestTs)}
                        </span>
                      </div>

                      <p className={`m-0 mt-1 truncate text-[12.5px] leading-tight ${isActive ? "text-slate-400 dark:text-slate-500" : unread > 0 ? "font-bold text-slate-800 dark:text-slate-200" : "font-medium text-slate-500 dark:text-slate-400"}`}>
                        {conversation.latestMessage?.body || "Start a conversation"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ConversationListPanel;

