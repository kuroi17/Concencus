import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import ImageDropzone from "../common/ImageDropzone";
import { useEscapeKey } from "../../hooks/useEscapeKey";

function EditProfileModal({ isOpen, initialProfile, onClose, onSave }) {
  const [srCode, setSrCode] = useState("");
  const [block, setBlock] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialAvatarUrl = useMemo(
    () => initialProfile?.avatar_url || "",
    [initialProfile?.avatar_url],
  );

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setSrCode(initialProfile?.sr_code || "");
      setBlock(initialProfile?.block || "");
      setAvatarFile(null);
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl("");
    });
  }, [avatarPreviewUrl, initialProfile?.block, initialProfile?.sr_code, isOpen]);

  const closeModal = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarFile(null);
    setAvatarPreviewUrl("");
    onClose();
  };

  useEscapeKey(isOpen, closeModal);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="soft-enter w-full max-w-[560px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="m-0 text-lg font-bold text-slate-900">Edit Profile</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-[10px] p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            try {
              const ok = await onSave({
                sr_code: srCode.trim() || null,
                block: block.trim() || null,
                avatarFile,
              });
              if (ok) closeModal();
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                SR Code
              </label>
              <input
                value={srCode}
                onChange={(e) => setSrCode(e.target.value)}
                placeholder="e.g. 21-0000-000"
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Block
              </label>
              <input
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="e.g. CS 2201"
                className="w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              />
            </div>
          </div>

          <div>
            <ImageDropzone
              label="Profile picture"
              description="Drag & drop a new profile photo, or click to browse."
              file={avatarFile}
              previewUrl={avatarPreviewUrl || initialAvatarUrl}
              disabled={isSubmitting}
              heightClassName="h-44"
              onChangeFile={(file) => {
                setAvatarFile(file);
                if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
                setAvatarPreviewUrl(file ? URL.createObjectURL(file) : "");
              }}
              onClear={() => {
                if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
                setAvatarFile(null);
                setAvatarPreviewUrl("");
              }}
            />
            <p className="m-0 mt-2 text-xs text-slate-500">
              Tip: a square image works best.
            </p>
          </div>

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
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;

