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
  shape = "rectangle", // "rectangle" or "circle"
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const setFile = (nextFile) => {
    onChangeFile?.(nextFile);
  };

  const isCircle = shape === "circle";

  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500" htmlFor={inputId}>
        {label}
      </label>

      <div
        className={`relative overflow-hidden transition-all duration-300 ${
          isCircle ? "mx-auto h-32 w-32 rounded-full shadow-lg" : `w-full rounded-2xl ${heightClassName} shadow-sm`
        } border-2 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${
          isDragging
            ? "border-[#800000] bg-red-50 dark:bg-red-950/20"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
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
          <div className="relative h-full w-full">
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear?.();
                }}
                className={`absolute ${isCircle ? "bottom-0 right-0" : "right-2 top-2"} inline-flex items-center justify-center rounded-full bg-slate-900/80 p-2 text-white shadow-md backdrop-blur-md transition-all hover:bg-slate-900 hover:scale-110`}
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className={`flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center ${isCircle ? "p-4" : ""}`}>
            <span className={`inline-flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ${isCircle ? "h-8 w-8" : "h-12 w-12"}`}>
              <ImageUp size={isCircle ? 16 : 22} />
            </span>
            {!isCircle && (
              <div>
                <p className="m-0 text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                  {isDragging ? "Drop to upload" : "Upload Image"}
                </p>
                <p className="m-0 mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
                  {description}
                </p>
              </div>
            )}
            {file?.name && !isCircle && (
              <p className="m-0 text-[10px] font-bold text-[#800000]">{file.name}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageDropzone;

