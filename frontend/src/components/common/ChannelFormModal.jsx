import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLayout } from "../layouts/MainLayout";
import { useEscapeKey } from "../../hooks/useEscapeKey";

function slugify(str) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function slugWithSuffix(str) {
  const base = slugify(str);
  const suffix = Math.random().toString(36).slice(2, 6); // e.g. "k3z9"
  return `${base}-${suffix}`;
}

export default function ChannelFormModal({ initial, fixedCategory, categories, onSave, onClose }) {
  const { setGlobalBackdropVisible } = useLayout();
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || fixedCategory || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !category) {
      setError("Name and category are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    const base = { name: name.trim(), description: description.trim(), category };

    try {
      // First attempt with clean slug
      await onSave({ ...base, slug: slugify(name) });
    } catch (err) {
      const msg = err.message || "";
      const isCollision =
        msg.includes("duplicate") ||
        msg.includes("unique") ||
        msg.includes("already exists");

      if (isCollision) {
        // Retry with a random suffix
        try {
          await onSave({ ...base, slug: slugWithSuffix(name) });
        } catch (retryErr) {
          setError(retryErr.message || "Something went wrong.");
        }
      } else {
        setError(msg || "Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setGlobalBackdropVisible("channel-form-modal", true);
    return () => setGlobalBackdropVisible("channel-form-modal", false);
  }, [setGlobalBackdropVisible]);
  useEscapeKey(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Edit Channel" : "New Channel"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {initial ? "Edit Channel" : "New Channel"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!!fixedCategory}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white disabled:opacity-50"
            >
              <option value="">Select a category</option>
              {(categories || []).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BS Computer Science"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Description <span className="font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-[#800000] py-2 text-sm font-semibold text-white hover:bg-[#991b1b] disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}