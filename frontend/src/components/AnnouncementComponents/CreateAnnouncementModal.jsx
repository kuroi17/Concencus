import { useState } from "react";
import { X } from "lucide-react";
import ImageDropzone from "../../common/ImageDropzone";
import { useEscapeKey } from "../../hooks/useEscapeKey";

const tags = ["Academic", "Event", "Opportunity", "Governance", "Maintenance"];
const priorities = ["FYI", "Normal", "Important", "Urgent"];

function CreateAnnouncementModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tag, setTag] = useState(tags[0]);
  const [priority, setPriority] = useState(priorities[0]);
  const [unit, setUnit] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl("");
    onClose();
  };

  useEscapeKey(Boolean(isOpen), onClose);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSubmitting(true);

    try {
      const wasSuccessful = await onSubmit({
        title: title.trim(),
        excerpt: excerpt.trim(),
        tag,
        priority,
        unit: unit.trim(),
        imageFile,
      });

      if (!wasSuccessful) return;

      setTitle("");
      setExcerpt("");
      setTag(tags[0]);
      setPriority(priorities[0]);
      setUnit("");
      setImageFile(null);
      setImagePreviewUrl("");
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Post announcement"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="soft-enter w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[16px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.1)] no-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Post Announcement</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="announcement-title"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Title
            </label>
            <input
              id="announcement-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter announcement title"
              className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="announcement-excerpt"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Message
            </label>
            <textarea
              id="announcement-excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="Write your announcement details"
              rows={4}
              className="w-full resize-none rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="announcement-tag"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Tag
              </label>
              <select
                id="announcement-tag"
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              >
                {tags.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="announcement-priority"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Priority
              </label>
              <select
                id="announcement-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              >
                {priorities.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="announcement-unit"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Unit / Office (optional)
            </label>
            <input
              id="announcement-unit"
              type="text"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="Example: CICS Student Affairs"
              className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
            />
          </div>

          <ImageDropzone
            label="Cover Image (optional)"
            description="Drag & drop an image here, or click to browse."
            file={imageFile}
            previewUrl={imagePreviewUrl}
            heightClassName="h-40"
            disabled={isSubmitting}
            onChangeFile={(file) => {
              setImageFile(file);
              if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
              setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
            }}
            onClear={() => {
              if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
              setImageFile(null);
              setImagePreviewUrl("");
            }}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
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
              {isSubmitting ? "Posting..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAnnouncementModal;