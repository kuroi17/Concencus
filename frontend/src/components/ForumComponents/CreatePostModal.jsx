import { ImageUp, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";

const MAX_IMAGES = 5;
const tags = ["General", "Announcement", "Curriculum", "Feedback"];

function CreatePostModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tag, setTag] = useState(tags[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFiles, setImageFiles] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // string[]
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputId = useId();
  const fileInputRef = useRef(null);

  const revokeAllPreviews = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
  };

  const closeModal = () => {
    revokeAllPreviews();
    setImageFiles([]);
    setImagePreviews([]);
    onClose();
  };

  useEscapeKey(isOpen, closeModal);

  if (!isOpen) return null;

  const addFiles = (files) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = incoming.slice(0, remaining);
    if (toAdd.length === 0) return;

    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSubmitting(true);
    await onSubmit({ title, excerpt, tag, isAnonymous, imageFiles });
    setIsSubmitting(false);

    // Reset form
    setTitle("");
    setExcerpt("");
    setTag(tags[0]);
    setIsAnonymous(false);
    revokeAllPreviews();
    setImageFiles([]);
    setImagePreviews([]);
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Start discussion"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="soft-enter w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[16px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.1)] no-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Start Discussion</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Keep it clear and descriptive"
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
                required
              />
            </div>

            <div>
              <label htmlFor="excerpt" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Content
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                className="w-full resize-none rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
                required
              />
            </div>

            <div>
              <label htmlFor="tag" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Tag
              </label>
              <select
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              >
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Multi-Image Upload ─────────────────────────────────── */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Photos ({imageFiles.length}/{MAX_IMAGES})
              </label>

              <div
                className={`rounded-[12px] border bg-white transition-colors ${
                  isSubmitting ? "cursor-not-allowed opacity-70" : ""
                } border-slate-300`}
              >
                {/* Preview grid */}
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {imagePreviews.map((url, idx) => (
                      <div
                        key={url}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[10px] border border-slate-200 bg-slate-100"
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        {!isSubmitting && (
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-rose-600"
                            aria-label={`Remove image ${idx + 1}`}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add button / dropzone */}
                {imageFiles.length < MAX_IMAGES && (
                  <div
                    className={`flex cursor-pointer items-center justify-center gap-2 px-4 py-3 text-center transition-colors hover:bg-slate-50 ${
                      imagePreviews.length > 0 ? "border-t border-slate-200" : ""
                    }`}
                    onClick={() => {
                      if (!isSubmitting) fileInputRef.current?.click();
                    }}
                    onDragOver={(e) => {
                      if (isSubmitting) return;
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (isSubmitting) return;
                      e.preventDefault();
                      addFiles(e.dataTransfer.files);
                    }}
                    role="button"
                    tabIndex={isSubmitting ? -1 : 0}
                    onKeyDown={(e) => {
                      if (isSubmitting) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <ImageUp size={16} />
                    </span>
                    <span className="text-sm text-slate-600">
                      {imagePreviews.length === 0
                        ? "Add photos (up to 5)"
                        : `Add more (${MAX_IMAGES - imageFiles.length} remaining)`}
                    </span>
                  </div>
                )}

                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isSubmitting}
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = ""; // allow re-selecting same file
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#7f1d1d] focus:ring-[#7f1d1d]"
              />
              <label htmlFor="anonymous" className="text-sm text-slate-700">
                Post Anonymously (Hides author ID from public)
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[10px] bg-[#7f1d1d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:opacity-70"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;
