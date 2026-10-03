"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

export function InfoTooltip({ label, children }: { label: string; children: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinned = useRef(false);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function show() {
    cancelClose();
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    if (!pinned.current && !triggerRef.current?.matches(":focus-visible")) {
      closeTimer.current = setTimeout(() => setOpen(false), 150);
    }
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const left = Math.max(12, Math.min(trigger.left + trigger.width / 2 - width / 2, window.innerWidth - width - 12));
    const top = trigger.bottom + height + 8 <= window.innerHeight - 12
      ? trigger.bottom + 8
      : Math.max(12, trigger.top - height - 8);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function close() {
      pinned.current = false;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !triggerRef.current?.contains(event.target) && !tooltipRef.current?.contains(event.target)) close();
    }
    function onScroll(event: Event) {
      if (event.target instanceof Node && tooltipRef.current?.contains(event.target)) return;
      close();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label} 설명`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") show(); }}
        onPointerLeave={scheduleClose}
        onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) show(); }}
        onBlur={() => {
          cancelClose();
          pinned.current = false;
          setOpen(false);
        }}
        onClick={() => {
          cancelClose();
          pinned.current = !pinned.current;
          setOpen(pinned.current);
        }}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full align-middle text-muted hover:bg-brand-soft hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Icon name="info" />
      </button>
      {open && createPortal(
        <span
          ref={tooltipRef}
          id={id}
          role="tooltip"
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          className="fixed z-50 max-h-[calc(100dvh-1.5rem)] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto whitespace-normal break-words rounded-xl border border-line-strong bg-white p-4 text-left text-sm font-normal leading-6 text-secondary shadow-popover"
        >
          {children}
        </span>,
        document.body,
      )}
    </>
  );
}
