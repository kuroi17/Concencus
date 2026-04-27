import { useRef, useState } from "react";
import { Send, Image, X, Smile } from "lucide-react";
import { uploadPublicImage } from "../../lib/storage";
import { useUser } from "../../context/UserContext";

function MessageComposer({ onSendMessage, disabled = false }) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const { user } = useUser();

  const handleChange = (e) => {
    setDraft(e.target.value);
    // Auto-grow up to ~160 px
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSendError("Please upload only image files");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSendError("Image file too large (max 5MB)");
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadPublicImage({
        file,
        bucketName: "chat-images",
        pathPrefix: user?.id || "temp",
        upsert: false,
      });
      setPreviewUrl(imageUrl);
      setSendError("");
    } catch (error) {
      setSendError(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          setUploading(true);
          try {
            const imageUrl = await uploadPublicImage({
              file,
              bucketName: "chat-images",
              pathPrefix: user?.id || "temp",
              upsert: false,
            });
            setPreviewUrl(imageUrl);
            setSendError("");
          } catch (error) {
            setSendError(error.message || "Failed to upload pasted image");
          } finally {
            setUploading(false);
          }
        }
      }
    }
  };

  const addEmoji = (emoji) => {
    setDraft((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const next = draft.trim();
    if ((!next && !previewUrl) || isSending || disabled) return;

    setIsSending(true);
    setSendError("");

    try {
      if (previewUrl) {
        // Send image message
        await onSendMessage(previewUrl, true);
        setPreviewUrl(null);
      } else if (next) {
        // Send text message
        await onSendMessage(next);
      }
      setDraft("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      setSendError(err.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const POPULAR_EMOJIS = [
    "😀", "😂", "🥰", "😍", "😊", "🤩", "🤔", "🙄",
    "🔥", "✨", "🙌", "👍", "❤️", "💯", "😢", "😡",
    "🎉", "🚀", "💀", "👀", "✅", "❌", "🤝", "🙏"
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-visible rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all focus-within:border-[#800000]/30 dark:focus-within:border-red-900/30 focus-within:shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
      aria-label="Message composer"
    >
      {sendError && (
        <p className="m-0 border-b border-rose-200/50 bg-rose-50/50 px-3 py-2 text-[11px] font-bold text-rose-600 backdrop-blur-sm">
          {sendError}
        </p>
      )}

      <div className="space-y-2">
        {/* Text input */}
        <div className="px-2 pt-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={disabled || isSending}
            rows={1}
            className="w-full min-h-[44px] max-h-[160px] resize-none border-0 bg-transparent px-3 py-3 text-[14px] font-medium text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder={
              disabled
                ? "Select a conversation to start messaging…"
                : "Type your message here..."
            }
          />
        </div>

        {/* Image preview */}
        {previewUrl && (
          <div className="relative inline-block px-4 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="group relative overflow-hidden rounded-[20px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-lg">
              {uploading ? (
                <div className="flex h-32 w-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#800000]" />
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-32 w-auto max-w-[240px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-md transition-all hover:bg-slate-900 hover:scale-110 shadow-lg"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="image-upload"
              className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-800/50 px-3 text-xs font-bold text-slate-600 dark:text-slate-400 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
            >
              <Image size={16} className="text-slate-400 transition-colors group-hover:text-[#800000] dark:group-hover:text-red-400" />
              <span className="hidden sm:inline">Photo</span>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={disabled || isSending || uploading}
            />
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-800/50 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 ${showEmojiPicker ? "ring-2 ring-[#800000]/20 border-[#800000]" : ""}`}
                title="Add emoji"
              >
                <Smile size={18} className={`${showEmojiPicker ? "text-[#800000]" : "text-slate-400"} transition-colors group-hover:text-[#800000]`} />
              </button>

              {showEmojiPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-[220px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 sm:left-auto sm:right-0">
                    <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Expressions</p>
                    <div className="grid grid-cols-6 gap-1">
                      {POPULAR_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-[10px] text-lg transition-all hover:bg-[#800000]/5 dark:hover:bg-white/5 hover:scale-105 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled || isSending || (!draft.trim() && !previewUrl)}
            className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-[#800000] px-6 text-[13px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="relative z-10">{isSending ? "..." : "Send"}</span>
            <Send size={15} className={`relative z-10 transition-transform duration-300 ${isSending ? "translate-x-1 -translate-y-1" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`} />
          </button>
        </div>
      </div>
    </form>
  );
}

export default MessageComposer;
