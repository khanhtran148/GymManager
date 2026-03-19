"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useViewModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const viewId = useMemo(
    () => searchParams.get("view"),
    [searchParams]
  );

  const isOpen = useMemo(() => viewId !== null, [viewId]);

  const open = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", id);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  return { isOpen, viewId, open, close };
}
