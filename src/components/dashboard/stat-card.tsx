import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS } from "@/lib/chart-colors";

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaLabel = "vs période précédente",
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  tint: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tint}1a`, color: tint }}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] text-muted-foreground">{label}</p>
          <p className="text-[22px] font-medium leading-tight tracking-tight">{value}</p>
        </div>
      </div>
      {delta !== undefined && delta !== null && (
        <div className="mt-3 flex items-center gap-1 text-[12px]">
          <span
            className="flex items-center gap-0.5 font-medium"
            style={{ color: delta >= 0 ? STATUS.good : STATUS.critical }}
          >
            {delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(delta)}%
          </span>
          <span className={cn("text-muted-foreground")}>{deltaLabel}</span>
        </div>
      )}
    </Card>
  );
}
