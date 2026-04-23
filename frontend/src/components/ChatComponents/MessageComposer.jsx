import { useRef, useState } from "react";
import { Send } from "lucide-react";

function MessageComposer({ onSendMessage, disabled = false }) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setDraft(e.target.value);
    // Auto-grow up to ~160 px
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const next = draft.trim();
    if (!next || isSending || disabled) return;

    setIsSending(true);
    setSendError("");

    try {
      await onSendMessage(next);
      setDraft("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      setSendError(err.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[12px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition focus-within:border-slate-300 dark:focus-within:border-slate-700 focus-within:shadow-[0_6px_20px_rgba(15,23,42,0.09)]"
      aria-label="Message composer"
    >
      {sendError && (
        <p className="m-0 border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {sendError}
        </p>
      )}

      <textarea
        ref={textareaRef}
        value={draft}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={disabled || isSending}
        rows={2}
        className="w-full resize-none border-0 bg-transparent px-3 pt-3 pb-1 text-sm text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        placeholder={
          disabled
            ? "Select a conversation to start messaging…"
            : "Write a message…"
        }
      />

      <div className="flex items-center justify-between px-3 pb-2.5">
        <p className="m-0 text-[11px] text-slate-400 dark:text-slate-500">
          Enter&nbsp;<span className="font-medium">to send</span>, Shift+Enter for new line
        </p>

        <button
          type="submit"
          disabled={disabled || isSending || draft.trim().length === 0}
          className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#7f1d1d] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "Sending…" : "Send"}
          <Send size={12} />
        </button>
      </div>
    </form>
  );
}

export default MessageComposer;
