"use client";

import { useEffect, useRef } from "react";

export function useUnsavedChanges(dirty: boolean) {
  const bypass = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const confirmLeave = () => bypass.current || window.confirm("저장하지 않은 변경사항이 있어요. 이동할까요?");
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!bypass.current) { event.preventDefault(); event.returnValue = ""; }
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || link.href === window.location.href) return;
      if (!confirmLeave()) { event.preventDefault(); event.stopPropagation(); }
    };
    // Capture before the router handles browser Back; a rejected navigation returns to this entry.
    const pop = (event: PopStateEvent) => {
      if (!confirmLeave()) { event.stopImmediatePropagation(); bypass.current = true; window.history.go(1); }
      else bypass.current = false;
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", pop, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
      window.removeEventListener("popstate", pop, true);
    };
  }, [dirty]);
  return () => { bypass.current = true; };
}
