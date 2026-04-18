import { MessageSquarePlus, Search } from "lucide-react";
import SidebarLogoutAction from "../../common/SidebarLogoutAction";

function getInitials(fullName) {
  if (!fullName) return "?";

  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function ChatSidebar({
  currentUser,
  conversations,
  activeConversationId,
  isLoadingConversations,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearchingProfiles,
  onSelectSearchResult,
  onSelectConversation,
}) {
  const hasSearchText = searchQuery.trim().length >= 2;

  return (
    <aside
      className="flex flex-col border-b border-slate-200 px-[14px] py-4 sm:px-[18px] lg:min-h-[calc(100vh-3rem)] lg:border-b-0 lg:border-r"
      aria-label="Chat sidebar"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2 className="m-0 text-[1.65rem] font-extrabold leading-tight text-slate-900">
          Direct Messages
        </h2>
        <p className="m-0 mt-0.5 text-xs uppercase tracking-[0.09em] text-slate-500">
          Governance Correspondence
        </p>
      </div>

      <div className="mt-4 rounded-[12px] border border-slate-200 bg-white p-2">
        <label
          htmlFor="chat-profile-search"
          className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
        >
          Start New Conversation
        </label>

        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="chat-profile-search"
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search by name or SR code"
            className="w-full rounded-[9px] border border-slate-200 bg-slate-50 py-2 pl-8 pr-2 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
          />
        </div>

        {hasSearchText && (
          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-[10px] border border-slate-200 p-1">
            {isSearchingProfiles && (
              <p className="m-0 px-2 py-2 text-xs text-slate-500">
                Searching...
              </p>
            )}

            {!isSearchingProfiles &&
              searchResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onSelectSearchResult(profile)}
                  className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-slate-100"
                >
                  <div className="h-8 w-8 rounded-[9px] bg-slate-800 text-center text-xs font-semibold leading-8 text-white">
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

                  <MessageSquarePlus
                    size={14}
                    className="ml-auto text-slate-400"
                  />
                </button>
              ))}

            {!isSearchingProfiles && searchResults.length === 0 && (
              <p className="m-0 px-2 py-2 text-xs text-slate-500">
                No matching profiles found.
              </p>
            )}
          </div>
        )}
      </div>

      <section className="mt-5 min-h-0 flex-1" aria-label="Conversation list">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Conversations
          </h3>
        </div>

        <div className="space-y-1 overflow-y-auto pr-1 lg:max-h-[48vh]">
          {isLoadingConversations && (
            <p className="m-0 px-2 py-2 text-sm text-slate-500">
              Loading chats...
            </p>
          )}

          {!isLoadingConversations && conversations.length === 0 && (
            <p className="m-0 rounded-[10px] border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500">
              Search a profile above to start your first DM.
            </p>
          )}

          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            const latestTimestamp =
              conversation.latestMessage?.created_at ||
              conversation.latest_message_at ||
              conversation.created_at;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full rounded-[10px] border px-2 py-2 text-left transition-colors ${
                  isActive
                    ? "border-slate-300 bg-slate-100"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="h-9 w-9 shrink-0 rounded-[10px] bg-slate-900 text-center text-xs font-semibold leading-9 text-white">
                    {getInitials(conversation.otherUser?.full_name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="m-0 truncate text-sm font-semibold text-slate-800">
                        {conversation.otherUser?.full_name || "Unknown User"}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {formatTimestamp(latestTimestamp)}
                      </span>
                    </div>

                    <p className="m-0 mt-0.5 truncate text-xs text-slate-500">
                      {conversation.latestMessage?.body || "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4">
        <p className="m-0 text-sm font-semibold text-slate-900">
          {currentUser?.full_name || "Authenticated User"}
        </p>
        <p className="m-0 mt-0.5 text-xs text-slate-600">
          {currentUser?.sr_code || "No SR Code"}
        </p>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4 lg:mt-auto">
        <SidebarLogoutAction />
      </div>
    </aside>
  );
}

export default ChatSidebar;
