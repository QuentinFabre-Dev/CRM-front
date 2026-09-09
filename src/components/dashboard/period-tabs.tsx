"use client";

import { PERIOD_LABELS, type PeriodKey } from "@/lib/period";
import { cn } from "@/lib/utils";

const ORDER: PeriodKey[] = ["today", "week", "month", "year"];

export function PeriodTabs({ value, onChange }: { value: PeriodKey; onChange: (p: PeriodKey) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-1 shadow-card">
      {ORDER.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
            value === key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {PERIOD_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
