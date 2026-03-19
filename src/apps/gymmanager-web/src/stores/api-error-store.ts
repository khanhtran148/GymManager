"use client";

import { create } from "zustand";

interface ApiErrorState {
  errorCode: 403 | 500 | null;
  setError: (code: 403 | 500) => void;
  clearError: () => void;
}

export const useApiErrorStore = create<ApiErrorState>()((set) => ({
  errorCode: null,
  setError: (code) => set({ errorCode: code }),
  clearError: () => set({ errorCode: null }),
}));
