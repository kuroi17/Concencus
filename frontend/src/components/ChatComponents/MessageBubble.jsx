function getInitials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({ message, currentUserId, otherUser }) {
  const isOwn = message.sender_id === currentUserId || message.type === "sent";
  const senderName = isOwn
    ? "You"
    : otherUser?.full_name || message.sender || "Unknown User";
  const messageText = message.body || message.text || "";
  const messageTime = formatTime(message.created_at || message.time);
  const avatarLabel = getInitials(isOwn ? "You" : senderName);

  return (
    <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && (
        <div className="mt-1 h-8 w-8 shrink-0 rounded-[10px] bg-slate-800 text-center text-xs font-semibold leading-8 text-white">
          {avatarLabel}
        </div>
      )}

      <div
        className={`max-w-[86%] sm:max-w-[72%] ${isOwn ? "text-right" : "text-left"}`}
      >
        <p className="m-0 text-[12px] text-slate-500">
          <span className="font-semibold text-slate-800">{senderName}</span>{" "}
          {messageTime}
        </p>
        <div
          className={`mt-1 inline-block px-3 py-2 text-sm leading-relaxed ${
            isOwn
              ? "rounded-[14px] bg-[#7f1d1d] text-white"
              : "rounded-[14px] border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {messageText}
        </div>
      </div>

      {isOwn && (
        <div className="mt-1 h-8 w-8 shrink-0 rounded-[10px] bg-slate-700 text-center text-xs font-semibold leading-8 text-white">
          {avatarLabel}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
