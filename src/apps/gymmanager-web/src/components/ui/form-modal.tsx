"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl";
  children: React.ReactNode;
}

const maxWidthMap: Record<NonNullable<FormModalProps["maxWidth"]>, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export function FormModal({
  isOpen,
  onClose,
  title,
  maxWidth = "lg",
  children,
}: FormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = "form-modal-title";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-50 m-auto w-full rounded-2xl shadow-2xl",
        maxWidthMap[maxWidth],
        "bg-card",
        "border border-border",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "open:flex open:flex-col"
      )}
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border flex-shrink-0">
        <h2
          id={titleId}
          className="text-base font-semibold text-text-primary truncate"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-hover transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto max-h-[80vh] px-6 py-4">
        {children}
      </div>
    </dialog>
  );
}
