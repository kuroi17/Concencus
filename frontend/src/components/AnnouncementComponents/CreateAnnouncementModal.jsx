import { useState } from "react";
import { X, Images, Trash2, GripVertical } from "lucide-react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import SDGSelector from "../Common/SDGSelector";

const tags = ["Academic", "Event", "Opportunity", "Governance", "Maintenance"];
const priorities = ["FYI", "Normal", "Important", "Urgent"];

// ── Multi-Image Uploader ──────────────────────────────────────────────────────
function MultiImageUploader({ images, onAdd, onRemove, onReorder, disabled }) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
    }));
    onAdd(newImages);
    // Reset input so same files can be re-added if removed
    e.target.value = "";
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("dragIndex", index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
    if (dragIndex === dropIndex) return;
    onReorder(dragIndex, dropIndex);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Images
        <span className="ml-1.5 text-xs font-normal text-slate-400">(optional · first image = cover)</span>
      </label>

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`relative group rounded-[10px] overflow-hidden border-2 transition-colors ${
                index === 0
                  ? "border-[#7f1d1d] ring-2 ring-[#7f1d1d]/20"
                  : "border-slate-200"
              }`}
              style={{ width: 80, height: 80 }}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
            >
              <img
                src={img.previewUrl}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Cover badge */}
              {index === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-[#7f1d1d] text-white text-[8px] font-black uppercase tracking-wider text-center py-0.5">
                  Cover
                </span>
              )}
              {/* Drag handle */}
              {!disabled && (
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-black/50 text-white">
                    <GripVertical size={10} />
                  </div>
                </div>
              )}
              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}

          {/* Add more button */}
          {!disabled && (
            <label className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-slate-200 cursor-pointer hover:border-[#7f1d1d] hover:bg-[#7f1d1d]/5 transition-colors"
              style={{ width: 80, height: 80 }}>
              <Images size={18} className="text-slate-400" />
              <span className="text-[9px] font-bold text-slate-400 mt-1">Add More</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
              />
            </label>
          )}
        </div>
      )}

      {/* Empty drop zone */}
      {images.length === 0 && (
        <label className="flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-slate-200 bg-slate-50 h-32 cursor-pointer hover:border-[#7f1d1d] hover:bg-[#7f1d1d]/5 transition-colors">
          <Images size={24} className="text-slate-300" />
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Click to upload images</p>
            <p className="text-[10px] text-slate-400">PNG, JPG, WEBP · Multiple allowed</p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
      )}

      {images.length > 0 && (
        <p className="text-[10px] text-slate-400 font-medium">
          Drag thumbnails to reorder · First image is the cover shown on the card
        </p>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
function CreateAnnouncementModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tag, setTag] = useState(tags[0]);
  const [priority, setPriority] = useState(priorities[0]);
  const [unit, setUnit] = useState("");
  const [sdgTags, setSdgTags] = useState([]);
  const [images, setImages] = useState([]); // [{ file, previewUrl, id }]
  const [isSubmitting, setIsSubmitting] = useState(false);

  const revokeAll = (imgs) => imgs.forEach((img) => URL.revokeObjectURL(img.previewUrl));

  const closeModal = () => {
    revokeAll(images);
    setImages([]);
    setSdgTags([]);
    onClose();
  };

  useEscapeKey(Boolean(isOpen), onClose);

  if (!isOpen) return null;

  const handleAddImages = (newImages) => setImages((prev) => [...prev, ...newImages]);

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReorder = (dragIndex, dropIndex) => {
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
  };

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
        sdgTags,
        imageFiles: images.map((img) => img.file), // ordered array of File objects
      });

      if (!wasSuccessful) return;

      revokeAll(images);
      setTitle("");
      setExcerpt("");
      setTag(tags[0]);
      setPriority(priorities[0]);
      setUnit("");
      setSdgTags([]);
      setImages([]);
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
          {/* Title */}
          <div>
            <label htmlFor="announcement-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Title
            </label>
            <input
              id="announcement-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="announcement-excerpt" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Message
            </label>
            <textarea
              id="announcement-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Write your announcement details"
              rows={4}
              className="w-full resize-none rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              required
            />
          </div>

          {/* Tag + Priority */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="announcement-tag" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Tag
              </label>
              <select
                id="announcement-tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              >
                {tags.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="announcement-priority" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Priority
              </label>
              <select
                id="announcement-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              >
                {priorities.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="announcement-unit" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Unit / Office (optional)
            </label>
            <input
              id="announcement-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Example: CICS Student Affairs"
              className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
            />
          </div>

          <SDGSelector 
            selectedSDGs={sdgTags} 
            onChange={setSdgTags} 
          />

          {/* Multi-image uploader */}
          <MultiImageUploader
            images={images}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            onReorder={handleReorder}
            disabled={isSubmitting}
          />

          {/* Actions */}
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