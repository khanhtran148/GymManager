"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useCreateModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isOpen = useMemo(
    () => searchParams.get("create") === "true",
    [searchParams]
  );

  const open = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("create", "true");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  return { isOpen, open, close };
}
