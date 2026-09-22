"use client";

import { useRef, useState } from "react";
import { Lightbulb } from "lucide-react";

const POPOVER_WIDTH = 340;

export function ExamplesHover({
  examples,
  label = "Exemples de mise en œuvre (NIST)",
}: {
  examples: string[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (examples.length === 0) return null;

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const show = () => {
    cancelClose();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      top: rect.bottom + 6,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 12)),
    });
    setOpen(true);
  };

  const scheduleHide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    // position: fixed (not absolute) so the popover escapes any scrolling
    // ancestor's clipping instead of being cut off inside the CSF tree.
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
        onClick={(e) => {
          e.stopPropagation();
          open ? setOpen(false) : show();
        }}
        aria-label={`${examples.length} exemple(s) de mise en œuvre`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-accent/70 transition hover:text-accent"
      >
        <Lightbulb size={13} />
      </button>
      {open && pos && (
        <div
          role="tooltip"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
          className="z-50 rounded-md border border-border bg-surface p-3 text-left shadow-popover"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleHide}
        >
          <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            <Lightbulb size={11} /> {label}
          </p>
          <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1 text-[12px] leading-snug">
            {examples.map((ex, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="shrink-0 text-muted-foreground">•</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
