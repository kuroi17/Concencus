import { useEffect, useRef } from "react";
import { ArrowLeft, CircleOff, Wifi, WifiOff } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

function ConnectionBadge({ socketStatus }) {
  if (socketStatus === "connected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[9px] border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
        <Wifi size={12} />
        Live
      </span>
    );
  }

  if (socketStatus === "connecting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[9px] border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
        <CircleOff size={12} />
        Connecting
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-[9px] border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
      <WifiOff size={12} />
      Offline
    </span>
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
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, conversation?.id]);

  if (!conversation) {
    return (
      <section className="space-y-4" aria-label="Chat thread">
        <header className="soft-enter border-b border-slate-200 pb-3">
          <h2 className="m-0 text-[1.7rem] font-semibold leading-tight text-slate-900 sm:text-[1.95rem] lg:text-[2.1rem]">
            Direct Messages
          </h2>
          <p className="m-0 mt-1 text-sm text-slate-600">
            Select an existing conversation or use the search bar to start one.
          </p>
        </header>

        <div className="rounded-[12px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No conversation selected.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Chat thread">
      <header className="soft-enter flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-1 rounded-[8px] border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <ArrowLeft size={12} />
              Back to conversations
            </button>
          )}

          <h2 className="m-0 text-[1.7rem] font-semibold leading-tight text-slate-900 sm:text-[1.95rem] lg:text-[2.1rem]">
            {conversation.otherUser?.full_name || "Conversation"}
          </h2>
          <p className="m-0 mt-1 text-sm text-slate-600">
            {conversation.otherUser?.campus_role
              ? `${conversation.otherUser.campus_role} • ${conversation.otherUser?.sr_code || "No SR Code"}`
              : "Private direct message"}
          </p>
        </div>

        <ConnectionBadge socketStatus={socketStatus} />
      </header>

      {messagesError && (
        <p className="m-0 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {messagesError}
        </p>
      )}

      <div
        ref={listRef}
        className="max-h-[55vh] space-y-4 overflow-y-auto rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-3"
      >
        {isLoadingMessages || isOpeningConversation ? (
          <p className="m-0 text-center text-sm text-slate-500">
            Loading conversation...
          </p>
        ) : null}

        {!isLoadingMessages &&
        !isOpeningConversation &&
        messages.length === 0 ? (
          <p className="m-0 text-center text-sm text-slate-500">
            No messages yet. Start the conversation below.
          </p>
        ) : null}

        {messages.map((message) => (
          <MessageBubble
            key={message.id || message.client_message_id}
            message={message}
            currentUserId={currentUserId}
            otherUser={conversation.otherUser}
          />
        ))}
      </div>

      <MessageComposer
        onSendMessage={onSendMessage}
        disabled={socketStatus !== "connected" || isOpeningConversation}
      />
    </section>
  );
}

export default ChatThread;
