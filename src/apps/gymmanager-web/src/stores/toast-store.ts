"use client";

import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  addToast: (toast) =>
    set((state) => {
      const newToast: Toast = {
        ...toast,
        id: crypto.randomUUID(),
        duration: toast.duration ?? 5000,
      };
      // Keep at most 5 toasts
      const trimmed = state.toasts.length >= 5 ? state.toasts.slice(1) : state.toasts;
      return { toasts: [...trimmed, newToast] };
    }),

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
