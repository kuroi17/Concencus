import React from "react";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function linkifyText(text) {
  if (!text) return null;
  return text.split(URL_REGEX).map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#800000] dark:text-red-400 underline underline-offset-2 hover:opacity-75 break-all transition-opacity"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}