import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAGES, type OpportunityStage } from "@/lib/types";
import { ORDINAL_BLUE } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/format";

export function PipelineCompact({ byStage }: { byStage: Record<OpportunityStage, number> }) {
  const total = STAGES.reduce((sum, s) => sum + (byStage[s.id] ?? 0), 0);
  const safeTotal = total || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline</CardTitle>
        <Link href="/opportunites" className="text-[12px] text-accent hover:underline">
          Voir le Kanban
        </Link>
      </CardHeader>
      <CardContent>
        <p className="text-[20px] font-medium tracking-tight">{formatCurrency(total)}</p>
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {STAGES.map((s, i) => (
            <div
              key={s.id}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${((byStage[s.id] ?? 0) / safeTotal) * 100}%`,
                backgroundColor: ORDINAL_BLUE[i],
                marginRight: i === STAGES.length - 1 ? 0 : 2,
              }}
              title={s.title}
            />
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {STAGES.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ORDINAL_BLUE[i] }} />
                {s.title}
              </span>
              <span className="font-medium">{formatCurrency(byStage[s.id] ?? 0)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
