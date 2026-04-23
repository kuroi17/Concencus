import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import ImageDropzone from "../common/ImageDropzone";
import { useEscapeKey } from "../../hooks/useEscapeKey";

function EditProfileModal({ isOpen, initialProfile, onClose, onSave }) {
  const [srCode, setSrCode] = useState("");
  const [block, setBlock] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialAvatarUrl = useMemo(() => initialProfile?.avatar_url || "", [initialProfile?.avatar_url]);
  const initialCoverUrl = useMemo(() => initialProfile?.cover_url || "", [initialProfile?.cover_url]);

  useEffect(() => {
    if (isOpen) {
      setSrCode(initialProfile?.sr_code || "");
      setBlock(initialProfile?.block || "");
      setAvatarFile(null);
      setAvatarPreviewUrl("");
      setCoverFile(null);
      setCoverPreviewUrl("");
    }
  }, [isOpen, initialProfile]);

  const closeModal = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setAvatarFile(null);
    setAvatarPreviewUrl("");
    setCoverFile(null);
    setCoverPreviewUrl("");
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
      <div className="soft-enter w-full max-w-[560px] overflow-hidden rounded-[18px] bg-white dark:bg-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h2 className="m-0 text-lg font-bold text-slate-900 dark:text-white">Edit Profile</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-[10px] p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
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
                coverFile,
              });
              if (ok) closeModal();
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                SR Code
              </label>
              <input
                value={srCode}
                onChange={(e) => setSrCode(e.target.value)}
                placeholder="e.g. 21-0000-000"
                className="w-full rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-[#7f1d1d] dark:focus:border-red-900"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Block
              </label>
              <input
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="e.g. CS 2201"
                className="w-full rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-colors focus:border-[#7f1d1d] dark:focus:border-red-900"
              />
            </div>
          </div>

          <div className="space-y-4">
            <ImageDropzone
              label="Cover Photo"
              description="A rectangular cover photo for your profile."
              file={coverFile}
              previewUrl={coverPreviewUrl || initialCoverUrl}
              disabled={isSubmitting}
              heightClassName="h-32"
              shape="rectangle"
              onChangeFile={(file) => {
                setCoverFile(file);
                if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                setCoverPreviewUrl(file ? URL.createObjectURL(file) : "");
              }}
              onClear={() => {
                if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                setCoverFile(null);
                setCoverPreviewUrl("");
              }}
            />

            <div className="flex flex-col items-center">
              <ImageDropzone
                label="Profile Picture"
                description="Square image works best."
                file={avatarFile}
                previewUrl={avatarPreviewUrl || initialAvatarUrl}
                disabled={isSubmitting}
                shape="circle"
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
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-[10px] px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
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

