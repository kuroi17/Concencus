import { useState } from "react";
import { Send } from "lucide-react";

function MessageComposer({ onSendMessage, disabled = false }) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextMessage = draft.trim();
    if (!nextMessage || isSending || disabled) return;

    setIsSending(true);
    setSendError("");

    try {
      await onSendMessage(nextMessage);
      setDraft("");
    } catch (error) {
      setSendError(error.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      aria-label="Message composer"
      onSubmit={handleSubmit}
    >
      {sendError && (
        <p className="m-0 border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {sendError}
        </p>
      )}

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
          }
        }}
        disabled={disabled || isSending}
        className="min-h-[96px] w-full resize-none border-0 px-3 py-3 text-sm text-slate-700 outline-none"
        placeholder={
          disabled
            ? "Connect and pick a conversation to send messages."
            : "Write a direct message..."
        }
      />

      <div className="flex items-center justify-between px-3 pb-3">
        <p className="m-0 text-xs text-slate-500">Enter to send, Shift+Enter for a new line</p>

        <button
          type="submit"
          disabled={disabled || isSending || draft.trim().length === 0}
          className="inline-flex items-center gap-1 rounded-[10px] bg-[#7f1d1d] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Sending" : "Send"}
          <Send size={14} />
        </button>
      </div>
    </form>
  );
}

export default MessageComposer;
