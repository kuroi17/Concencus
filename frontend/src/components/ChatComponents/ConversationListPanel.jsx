import { MessageCircleMore, Search, X } from "lucide-react";

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
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-slate-200" />
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
  // search
  searchQuery,
  onSearchChange,
  searchResults,
  isSearchingProfiles,
  isOpeningConversation,
  onSelectSearchResult,
}) {
  const hasSearchText = searchQuery.trim().length >= 2;

  return (
    <div className="flex h-full flex-col">
      {/* ── Search bar ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white p-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-[10px] border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,23,42,0.06)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {/* Search results */}
        {hasSearchText ? (
          <div className="p-2">
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              People
            </p>

            {isSearchingProfiles && (
              <p className="px-2 py-2 text-xs text-slate-500">Searching…</p>
            )}

            {!isSearchingProfiles && searchResults.length === 0 && (
              <p className="px-2 py-3 text-xs text-slate-500">
                No results for &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {!isSearchingProfiles &&
              searchResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onSelectSearchResult(profile)}
                  disabled={isOpeningConversation}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition hover:bg-slate-100 disabled:opacity-60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                    {getInitials(profile.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-semibold text-slate-800">
                      {profile.full_name}
                    </p>
                    <p className="m-0 truncate text-xs text-slate-500">
                      {profile.sr_code || "No SR Code"}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        ) : (
          /* ── Conversation list ── */
          <>
            {isLoadingConversations && <LoadingSkeleton />}

            {!isLoadingConversations && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <MessageCircleMore size={36} className="mb-3 text-slate-300" />
                <p className="m-0 text-sm font-medium text-slate-500">
                  No conversations yet
                </p>
                <p className="m-0 mt-1 text-xs text-slate-400">
                  Search for someone above to start chatting
                </p>
              </div>
            )}

            <div className="space-y-0.5 p-2">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                const unread = unreadCounts?.get(conversation.id) || 0;
                const badge = formatUnread(unread);
                const latestTs =
                  conversation.latestMessage?.created_at ||
                  conversation.latest_message_at ||
                  conversation.created_at;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => onOpenConversation(conversation.id)}
                    className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? "bg-[#7f1d1d]/10"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {/* Avatar with unread dot */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${
                          isActive ? "bg-[#7f1d1d]" : "bg-slate-700"
                        }`}
                      >
                        {getInitials(conversation.otherUser?.full_name)}
                      </div>
                      {badge && (
                        <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-px text-[10px] font-bold leading-none text-white">
                          {badge}
                        </span>
                      )}
                    </div>

                    {/* Name + preview */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <p
                          className={`m-0 truncate text-sm ${
                            unread > 0
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-800"
                          }`}
                        >
                          {conversation.otherUser?.full_name || "Unknown User"}
                        </p>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatTimestamp(latestTs)}
                        </span>
                      </div>
                      <p
                        className={`m-0 mt-0.5 truncate text-xs ${
                          unread > 0
                            ? "font-medium text-slate-700"
                            : "text-slate-500"
                        }`}
                      >
                        {conversation.latestMessage?.body || "No messages yet"}
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
