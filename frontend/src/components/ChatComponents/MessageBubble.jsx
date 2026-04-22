import { MoreVertical, SmilePlus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

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

function groupReactions(reactions) {
  const counts = new Map();
  reactions.forEach((reaction) => {
    counts.set(reaction.emoji, (counts.get(reaction.emoji) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count }));
}

const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function MessageBubble({
  message,
  currentUserId,
  otherUser,
  reactions = [],
  onToggleReaction,
  onDeleteMessage,
}) {
  const isOwn = message.sender_id === currentUserId || message.type === "sent";
  const senderName = isOwn
    ? "You"
    : otherUser?.full_name || message.sender || "Unknown";
  const isDeleted = Boolean(message.deleted_at);
  const messageText = isDeleted
    ? isOwn
      ? "You deleted this message."
      : `${senderName} deleted this message.`
    : message.body || message.text || "";
  const messageTime = formatTime(message.created_at || message.time);
  const isOptimistic = !message.id || String(message.id).startsWith("client-");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);
  const hasActions = Boolean(message.id) && !isOptimistic && !isDeleted;

  return (
    <div
      className={`group mb-3 flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
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

        <div className="relative">
          {/* Bubble */}
          <div
            className={`inline-block rounded-[16px] px-3.5 py-2 text-sm leading-relaxed transition-opacity ${
              isOwn
                ? "rounded-br-[4px] bg-[#7f1d1d] text-white"
                : "rounded-bl-[4px] border border-slate-200 bg-white text-slate-800"
            } ${isOptimistic ? "opacity-70" : "opacity-100"} ${
              isDeleted ? "italic opacity-80" : ""
            }`}
          >
            {messageText}
          </div>

          {/* Reactions bar */}
          {grouped.length > 0 && (
            <div
              className={`mt-1 inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[12px] shadow-sm ${
                isOwn ? "ml-auto" : ""
              }`}
            >
              {grouped.map((entry) => (
                <span key={entry.emoji} className="inline-flex items-center gap-1">
                  <span>{entry.emoji}</span>
                  <span className="text-slate-600">{entry.count}</span>
                </span>
              ))}
            </div>
          )}

          {/* Hover actions */}
          {hasActions && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                isOwn ? "-left-14" : "-right-14"
              } hidden items-center gap-1 group-hover:flex`}
            >
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-sm">
                {quickEmojis.slice(0, 3).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded-full px-1.5 py-1 text-sm transition hover:bg-slate-100"
                    onClick={() => onToggleReaction?.(message.id, emoji)}
                    aria-label={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded-full px-1.5 py-1 text-slate-600 transition hover:bg-slate-100"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-label="More actions"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {isMenuOpen && (
                <div
                  className={`absolute ${
                    isOwn ? "left-0" : "right-0"
                  } top-[calc(100%+8px)] w-48 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]`}
                  role="menu"
                >
                  <div className="border-b border-slate-200 px-3 py-2">
                    <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      React
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="rounded-full px-2 py-1 text-sm transition hover:bg-slate-100"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onToggleReaction?.(message.id, emoji);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isOwn && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                      onClick={async () => {
                        setIsMenuOpen(false);
                        const ok = window.confirm("Delete this message?");
                        if (!ok) return;
                        try {
                          await onDeleteMessage?.(message.id);
                        } catch (error) {
                          alert(error?.message || "Failed to delete message.");
                        }
                      }}
                      role="menuitem"
                    >
                      <Trash2 size={16} />
                      Delete message
                    </button>
                  )}

                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setIsMenuOpen(false);
                      alert("More actions coming soon.");
                    }}
                    role="menuitem"
                  >
                    <SmilePlus size={16} />
                    Add reaction
                  </button>
                </div>
              )}
            </div>
          )}
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
