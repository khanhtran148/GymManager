"use client";

import { create } from "zustand";

interface LoadingState {
  activeRequests: number;
  isLoading: boolean;
  increment: () => void;
  decrement: () => void;
}

export const useLoadingStore = create<LoadingState>()((set) => ({
  activeRequests: 0,
  isLoading: false,
  increment: () =>
    set((state) => ({
      activeRequests: state.activeRequests + 1,
      isLoading: true,
    })),
  decrement: () =>
    set((state) => {
      const next = Math.max(0, state.activeRequests - 1);
      return { activeRequests: next, isLoading: next > 0 };
    }),
}));
