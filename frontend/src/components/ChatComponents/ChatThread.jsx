import { useEffect, useRef } from "react";
import { ArrowLeft, CircleOff, MessageCircle, Wifi, WifiOff } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function ConnectionBadge({ socketStatus }) {
  if (socketStatus === "connected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[8px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <Wifi size={11} />
        Live
      </span>
    );
  }
  if (socketStatus === "connecting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[8px] border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        <CircleOff size={11} />
        Connecting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[8px] border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
      <WifiOff size={11} />
      Offline
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="rounded-full bg-slate-100 p-6">
        <MessageCircle size={38} className="text-slate-300" />
      </div>
      <div>
        <h3 className="m-0 text-base font-semibold text-slate-600">
          No conversation selected
        </h3>
        <p className="m-0 mt-2 max-w-[260px] text-sm leading-relaxed text-slate-400">
          Search for someone or pick a conversation on the left to start
          messaging.
        </p>
      </div>
    </div>
  );
}

function ContactIntroCard({ otherUser }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-2xl font-bold text-white shadow-lg">
        {getInitials(otherUser?.full_name)}
      </div>
      <div>
        <h3 className="m-0 text-xl font-bold text-slate-900">
          {otherUser?.full_name || "Unknown User"}
        </h3>
        {otherUser?.sr_code && (
          <p className="m-0 mt-1 text-sm text-slate-500">{otherUser.sr_code}</p>
        )}
        {otherUser?.campus_role && (
          <p className="m-0 mt-0.5 text-xs capitalize text-slate-400">
            {otherUser.campus_role}
          </p>
        )}
        <p className="m-0 mt-4 text-sm text-slate-400">
          You started this conversation. Say hello! 👋
        </p>
      </div>
    </div>
  );
}

function ChatThread({
  conversation,
  messages,
  currentUserId,
  isLoadingMessages,
  messagesError,
  socketStatus,
  onSendMessage,
  isOpeningConversation,
  onBack,
  reactionsByMessage,
  onToggleReaction,
  onDeleteMessage,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, conversation?.id]);

  // ── No conversation selected ────────────────────────────────
  if (!conversation) {
    return <EmptyState />;
  }

  const showIntroCard =
    !isLoadingMessages &&
    !isOpeningConversation &&
    messages.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Thread header ──────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        {/* Mobile back button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mr-1 inline-flex items-center justify-center rounded-[8px] border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
          {getInitials(conversation.otherUser?.full_name)}
        </div>

        {/* Name + role */}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-sm font-bold text-slate-900">
            {conversation.otherUser?.full_name || "Conversation"}
          </p>
          <p className="m-0 truncate text-xs text-slate-500">
            {conversation.otherUser?.campus_role
              ? `${conversation.otherUser.campus_role}${conversation.otherUser?.sr_code ? " · " + conversation.otherUser.sr_code : ""}`
              : "Direct message"}
          </p>
        </div>

        <ConnectionBadge socketStatus={socketStatus} />
      </header>

      {/* ── Error banner ───────────────────────────────────────── */}
      {messagesError && (
        <p className="m-0 shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">
          {messagesError}
        </p>
      )}

      {/* ── Disconnection banner ──────────────────────────────── */}
      {socketStatus !== "connected" && (
        <div className="shrink-0 flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
          <WifiOff size={14} className="shrink-0 text-amber-600" />
          <p className="m-0 text-xs font-medium text-amber-700">
            {socketStatus === "connecting"
              ? "Connecting to chat server… Please wait."
              : "Chat server is offline. Make sure the backend is running (npm run backend:dev) and refresh the page."}
          </p>
        </div>
      )}

      {/* ── Message list ───────────────────────────────────────── */}
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#f8f9fb] px-4 py-4"
      >
        {/* Contact intro card — shown when 0 messages */}
        {showIntroCard && (
          <ContactIntroCard otherUser={conversation.otherUser} />
        )}

        {/* Loading */}
        {(isLoadingMessages || isOpeningConversation) && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                {i % 2 === 0 && (
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-200" />
                )}
                <div
                  className={`h-10 animate-pulse rounded-[14px] bg-slate-200 ${i % 2 === 0 ? "w-48" : "w-36"}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {!isLoadingMessages &&
          !isOpeningConversation &&
          messages.map((message) => (
            <MessageBubble
              key={message.id || message.client_message_id}
              message={message}
              currentUserId={currentUserId}
              otherUser={conversation.otherUser}
              reactions={(message.id && reactionsByMessage?.get(String(message.id))) || []}
              onToggleReaction={onToggleReaction}
              onDeleteMessage={onDeleteMessage}
            />
          ))}
      </div>

      {/* ── Composer ───────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <MessageComposer
          onSendMessage={onSendMessage}
          disabled={socketStatus !== "connected" || isOpeningConversation}
        />
      </div>
    </div>
  );
}

export default ChatThread;
