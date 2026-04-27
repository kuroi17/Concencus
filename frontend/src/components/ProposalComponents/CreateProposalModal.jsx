import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import SDGSelector from "../common/SDGSelector";
import { useLayout } from "../layouts/MainLayout";

const categories = ["Academic", "Facilities", "Policy"];

function CreateProposalModal({ isOpen, onClose, onSubmit }) {
  const { setGlobalBackdropVisible } = useLayout();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [sdgTags, setSdgTags] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    setTitle("");
    setDescription("");
    setCategory(categories[0]);
    setSdgTags([]);
    setIsAnonymous(false);
    onClose();
  };

  useEscapeKey(isOpen, closeModal);
  useEffect(() => {
    setGlobalBackdropVisible("create-proposal-modal", isOpen);
    return () => setGlobalBackdropVisible("create-proposal-modal", false);
  }, [isOpen, setGlobalBackdropVisible]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit({ 
      title, 
      description, 
      category, 
      sdgTags, 
      isAnonymous
    });
    setIsSubmitting(false);
    if (success) {
      closeModal();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Submit proposal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="soft-enter w-full max-w-[500px] overflow-hidden rounded-[16px] bg-white dark:bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.1)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Governance Proposal</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="p-title" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Title
              </label>
              <input
                id="p-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to change?"
                className="w-full rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-[#7f1d1d]"
                required
              />
            </div>

            <div>
              <label htmlFor="p-desc" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Content
              </label>
              <textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the problem and your proposed solution..."
                rows={4}
                className="w-full resize-none rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-[#7f1d1d]"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="p-cat" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  id="p-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-[#7f1d1d]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <SDGSelector 
              selectedSDGs={sdgTags} 
              onChange={setSdgTags} 
            />

            <div className="flex items-center gap-2">
              <input
                id="p-anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#7f1d1d] focus:ring-[#7f1d1d]"
              />
              <label htmlFor="p-anonymous" className="text-sm text-slate-700 dark:text-slate-300">
                Post Anonymously (Hides author ID from public)
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[10px] bg-[#7f1d1d] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#991b1b] disabled:opacity-70 active:scale-95 shadow-sm shadow-red-900/10"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default CreateProposalModal;
