import { ImageUp, X } from "lucide-react";
import { useId, useRef, useState } from "react";

function ImageDropzone({
  label = "Photo (optional)",
  description = "Drag & drop an image here, or click to browse.",
  file,
  previewUrl,
  onChangeFile,
  onClear,
  disabled = false,
  heightClassName = "h-36",
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const setFile = (nextFile) => {
    onChangeFile?.(nextFile);
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={inputId}>
        {label}
      </label>

      <div
        className={`relative overflow-hidden rounded-[12px] border bg-white transition-colors ${
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        } ${
          isDragging
            ? "border-[#7f1d1d]/60 bg-rose-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(false);
          const next = event.dataTransfer.files?.[0] || null;
          if (next) setFile(next);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-disabled={disabled}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            const next = event.target.files?.[0] || null;
            setFile(next);
          }}
        />

        {previewUrl ? (
          <div className={`relative ${heightClassName} w-full bg-slate-100`}>
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear?.();
                }}
                className="absolute right-2 top-2 inline-flex items-center justify-center rounded-[10px] bg-white/90 p-2 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className={`flex ${heightClassName} w-full flex-col items-center justify-center gap-2 px-4 text-center`}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <ImageUp size={18} />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-800">
                {isDragging ? "Drop to upload" : "Upload an image"}
              </p>
              <p className="m-0 mt-0.5 text-xs text-slate-500">{description}</p>
            </div>
            {file?.name && (
              <p className="m-0 text-xs font-medium text-slate-600">{file.name}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageDropzone;

