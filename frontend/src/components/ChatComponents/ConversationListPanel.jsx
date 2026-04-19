import { Clock4, MessageCircle } from "lucide-react";

function getInitials(name) {
  if (!name) return "?";

  return name
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

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function ConversationListPanel({
  conversations,
  isLoadingConversations,
  onOpenConversation,
}) {
  return (
    <section className="space-y-4" aria-label="Conversation list panel">
      <header className="soft-enter border-b border-slate-200 pb-3">
        <h2 className="m-0 text-[1.7rem] font-semibold leading-tight text-slate-900 sm:text-[1.95rem] lg:text-[2.1rem]">
          Direct Messages
        </h2>
        <p className="m-0 mt-1 text-sm text-slate-600">
          Click a conversation to open the thread and send messages.
        </p>
      </header>

      {isLoadingConversations ? (
        <p className="m-0 rounded-[12px] border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Loading conversations...
        </p>
      ) : null}

      {!isLoadingConversations && conversations.length === 0 ? (
        <p className="m-0 rounded-[12px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No conversations yet. Search a user from the header to start one.
        </p>
      ) : null}

      <div className="space-y-3">
        {conversations.map((conversation) => {
          const latestTimestamp =
            conversation.latestMessage?.created_at ||
            conversation.latest_message_at ||
            conversation.created_at;

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onOpenConversation(conversation.id)}
              className="w-full rounded-[14px] border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 rounded-full bg-slate-900 text-center text-base font-semibold leading-[3rem] text-white">
                  {getInitials(conversation.otherUser?.full_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 truncate text-[1.12rem] font-semibold text-slate-900">
                      {conversation.otherUser?.full_name || "Unknown User"}
                    </p>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Clock4 size={12} />
                      {formatTimestamp(latestTimestamp)}
                    </span>
                  </div>

                  <p className="m-0 mt-1 truncate text-sm text-slate-600">
                    {conversation.latestMessage?.body || "No messages yet"}
                  </p>
                </div>

                <MessageCircle
                  size={18}
                  className="mt-1 shrink-0 text-slate-400"
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ConversationListPanel;
