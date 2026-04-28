import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLayout } from "../layouts/MainLayout";
import { useEscapeKey } from "../../hooks/useEscapeKey";

function slugify(str) {
  return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function slugWithSuffix(str) {
  const base = slugify(str);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export default function CategoryFormModal({ initial, onSave, onClose }) {
  const { setGlobalBackdropVisible } = useLayout();
  const [label, setLabel] = useState(initial?.label || "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!label.trim()) {
      setError("Label is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    const base = { label: label.trim(), sort_order: Number(sortOrder) };

    try {
      // First attempt with clean slug as id
      await onSave({ ...base, id: slugify(label) });
    } catch (err) {
      const msg = err.message || "";
      const isCollision =
        msg.includes("duplicate") ||
        msg.includes("unique") ||
        msg.includes("already exists");

      if (isCollision) {
        try {
          await onSave({ ...base, id: slugWithSuffix(label) });
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
    setGlobalBackdropVisible("category-form-modal", true);
    return () => setGlobalBackdropVisible("category-form-modal", false);
  }, [setGlobalBackdropVisible]);
  useEscapeKey(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="New Category"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            New Category
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Organizations"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
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