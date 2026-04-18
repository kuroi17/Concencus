import { AtSign, Paperclip, Send } from "lucide-react";

function MessageComposer() {
  return (
    <section
      className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      aria-label="Message composer"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-slate-600">
        <button type="button" className="text-sm font-semibold">
          B
        </button>
        <button type="button" className="text-sm italic">
          I
        </button>
        <button type="button" className="text-sm underline">
          U
        </button>
        <span className="h-4 w-px bg-slate-300" />
        <button type="button" className="text-sm">
          Link
        </button>
      </div>

      <textarea
        className="min-h-[96px] w-full resize-none border-0 px-3 py-3 text-sm text-slate-700 outline-none"
        placeholder="Draft message to this thread..."
      />

      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-2 text-slate-600">
          <button
            type="button"
            className="rounded p-1.5 transition-colors hover:bg-slate-100"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            className="rounded p-1.5 transition-colors hover:bg-slate-100"
            aria-label="Mention someone"
          >
            <AtSign size={16} />
          </button>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[10px] bg-[#7f1d1d] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b]"
        >
          Send
          <Send size={14} />
        </button>
      </div>
    </section>
  );
}

export default MessageComposer;
