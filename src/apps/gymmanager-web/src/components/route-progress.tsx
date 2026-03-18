"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "@/stores/loading-store";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isApiLoading = useLoadingStore((s) => s.isLoading);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevUrl = useRef(pathname);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function startProgress() {
    clearTimers();
    setVisible(true);
    setProgress(30);
    timersRef.current.push(setTimeout(() => setProgress(60), 150));
    timersRef.current.push(setTimeout(() => setProgress(80), 400));
  }

  function completeProgress() {
    clearTimers();
    setProgress(100);
    timersRef.current.push(
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250)
    );
  }

  // Route changes
  useEffect(() => {
    if (prevUrl.current !== pathname) {
      prevUrl.current = pathname;
      startProgress();
      timersRef.current.push(setTimeout(completeProgress, 500));
    }
    return clearTimers;
  }, [pathname, searchParams]);

  // API requests
  useEffect(() => {
    if (isApiLoading) {
      startProgress();
    } else if (visible && progress > 0 && progress < 100) {
      completeProgress();
    }
  }, [isApiLoading]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5" aria-hidden="true">
      <div
        className="h-full bg-primary-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
