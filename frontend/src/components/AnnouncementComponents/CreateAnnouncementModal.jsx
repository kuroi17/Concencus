import { useState, useRef } from "react";
import { X, Image as ImageIcon } from "lucide-react";

const tags = ["Academic", "Event", "Opportunity", "Governance", "Maintenance",];
const priorities = ["FYI", "Normal", "Important", "Urgent"];

function CreateAnnouncementModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tag, setTag] = useState(tags[0]);
  const [priority, setPriority] = useState(priorities[0]);
  const [unit, setUnit] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Hanggang 5MB lang para di mabigat
        alert("File is too large. Please select an image under 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Gagawa ng temporary preview
    }
  };

  // Function para tanggalin ang picture kung nagkamali
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSubmitting(true);

    try {
      // 🚀 Ipapasa na rito yung imageFile pabalik sa Board para ma-upload
      const wasSuccessful = await onSubmit({
        title: title.trim(),
        excerpt: excerpt.trim(),
        tag,
        priority,
        unit: unit.trim(),
        imageFile: imageFile 
      });

      if (!wasSuccessful) return;

      // Reset lahat ng forms kapag successful
      setTitle("");
      setExcerpt("");
      setTag(tags[0]);
      setPriority(priorities[0]);
      setUnit("");
      clearImage();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="soft-enter w-full max-w-[540px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            Post Announcement
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cover Image (Optional)</label>
            {imagePreview ? (
              <div className="relative h-[160px] w-full overflow-hidden rounded-[10px] border border-slate-300">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button type="button" onClick={clearImage} className="absolute right-2 top-2 rounded-full bg-slate-900/60 p-1 text-white transition-colors hover:bg-red-600">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-slate-300 bg-slate-50 py-6 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-100"
              >
                <ImageIcon size={24} className="text-slate-400" />
                <span>Click to upload an image</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
          </div>

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

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
