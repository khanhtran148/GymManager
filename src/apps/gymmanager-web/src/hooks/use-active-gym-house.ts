"use client";

import { useEffect } from "react";
import { useGymHouses } from "@/hooks/use-gym-houses";
import { useGymHouseStore } from "@/stores/gym-house-store";
import type { GymHouseDto } from "@/types/gym-house";

interface UseActiveGymHouseResult {
  gymHouseId: string | null;
  gymHouses: GymHouseDto[];
  isLoading: boolean;
  setGymHouseId: (id: string) => void;
}

export function useActiveGymHouse(): UseActiveGymHouseResult {
  const { data: gymHouses, isLoading } = useGymHouses();
  const activeGymHouseId = useGymHouseStore((s) => s.activeGymHouseId);
  const setActiveGymHouseId = useGymHouseStore((s) => s.setActiveGymHouseId);

  // Auto-select the first gym house if none is selected and data is available
  useEffect(() => {
    if (!activeGymHouseId && gymHouses && gymHouses.length > 0) {
      setActiveGymHouseId(gymHouses[0].id);
    }
  }, [activeGymHouseId, gymHouses, setActiveGymHouseId]);

  // Resolve the effective ID: use stored value if it still exists in the list,
  // otherwise fall back to the first available gym house.
  const resolvedId =
    gymHouses && gymHouses.length > 0
      ? (gymHouses.find((g) => g.id === activeGymHouseId)?.id ??
        gymHouses[0].id)
      : null;

  return {
    gymHouseId: resolvedId,
    gymHouses: gymHouses ?? [],
    isLoading,
    setGymHouseId: setActiveGymHouseId,
  };
}
