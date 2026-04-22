import { useEffect } from "react";

export function useEscapeKey(isActive, onEscape) {
  useEffect(() => {
    if (!isActive) return undefined;

    const handler = (event) => {
      if (event.key === "Escape") {
        onEscape?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, onEscape]);
}

