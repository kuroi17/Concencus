function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatTime(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function MessageBubble({ message, currentUserId, otherUser }) {
  const isOwn = message.sender_id === currentUserId || message.type === "sent";
  const senderName = isOwn
    ? "You"
    : otherUser?.full_name || message.sender || "Unknown";
  const messageText = message.body || message.text || "";
  const messageTime = formatTime(message.created_at || message.time);
  const isOptimistic = !message.id || String(message.id).startsWith("client-");

  return (
    <div className={`mb-3 flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {/* Other user avatar */}
      {!isOwn && (
        <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-slate-700 text-[11px] font-semibold text-white">
          {getInitials(senderName)}
        </div>
      )}

      <div className={`max-w-[78%] sm:max-w-[65%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {/* Sender name + time */}
        <p className="m-0 mb-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-600">{senderName}</span>
          {" · "}
          {messageTime}
        </p>

        {/* Bubble */}
        <div
          className={`inline-block rounded-[16px] px-3.5 py-2 text-sm leading-relaxed transition-opacity ${
            isOwn
              ? "rounded-br-[4px] bg-[#7f1d1d] text-white"
              : "rounded-bl-[4px] border border-slate-200 bg-white text-slate-800"
          } ${isOptimistic ? "opacity-70" : "opacity-100"}`}
        >
          {messageText}
        </div>
      </div>

      {/* Own avatar */}
      {isOwn && (
        <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-slate-600 text-[11px] font-semibold text-white">
          {getInitials("You")}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
