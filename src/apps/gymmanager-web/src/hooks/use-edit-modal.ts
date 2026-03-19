"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useEditModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // editId is the entity ID being edited, or null if modal is closed
  const editId = useMemo(
    () => searchParams.get("edit"),
    [searchParams]
  );

  const isOpen = useMemo(() => editId !== null, [editId]);

  const open = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams]);

  return { isOpen, editId, open, close };
}
