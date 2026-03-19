"use client";

import { useState, useEffect } from "react";

/**
 * Returns false during SSR and initial hydration, true after client mount.
 * Used to prevent hydration mismatches with permission-gated content.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
