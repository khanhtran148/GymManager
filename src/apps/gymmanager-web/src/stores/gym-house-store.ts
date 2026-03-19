"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GymHouseState {
  activeGymHouseId: string | null;
  setActiveGymHouseId: (id: string) => void;
}

export const useGymHouseStore = create<GymHouseState>()(
  persist(
    (set) => ({
      activeGymHouseId: null,
      setActiveGymHouseId: (id: string) => set({ activeGymHouseId: id }),
    }),
    {
      name: "gym-house-storage",
    }
  )
);
