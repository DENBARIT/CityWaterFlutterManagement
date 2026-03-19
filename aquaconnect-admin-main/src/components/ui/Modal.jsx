"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  fullPage = false,
}) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const overlayClass = fullPage
    ? "fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    : "fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm";

  const cardClass = fullPage
    ? "bg-[#05141f] border border-[rgba(29,158,117,0.15)] rounded-2xl w-[min(96vw,1100px)] h-[calc(100vh-2rem)] overflow-hidden flex flex-col"
    : "bg-[#05141f] border border-[rgba(29,158,117,0.15)] rounded-2xl w-full max-w-md mx-4 overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col";

  const contentClass = fullPage
    ? "px-6 py-5 overflow-y-auto"
    : "px-6 py-5 overflow-y-auto";

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={cardClass} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(29,158,117,0.08)]">
          <h2 className="font-syne font-bold text-sm tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-[rgba(232,244,240,0.3)] hover:text-[#e8f4f0] transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className={contentClass}>{children}</div>
      </div>
    </div>
  );
}
