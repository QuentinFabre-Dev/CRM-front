import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDINAL_BLUE } from "@/lib/chart-colors";
import type { ChargeabilitySummary, FiscalYearRange } from "@/lib/fiscal-year";

export function ChargeabilityWidget({
  summary,
  target,
  fiscalYear,
}: {
  summary: ChargeabilitySummary;
  target: number;
  fiscalYear: FiscalYearRange;
}) {
  const pct = Math.min(100, summary.percentage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chargeabilité</CardTitle>
        <Link href="/chargeabilite" className="text-[12px] text-accent hover:underline">
          Saisir
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-[26px] font-medium tracking-tight">{summary.percentage}%</span>
          <span className="text-[12px] text-muted-foreground">objectif {target}%</span>
        </div>
        <div className="relative mt-3 h-2.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: ORDINAL_BLUE[3] }}
          />
          <div
            className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-foreground/60"
            style={{ left: `${Math.min(100, target)}%` }}
            title={`Objectif ${target}%`}
          />
        </div>
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          {fiscalYear.label} · {summary.weeksLogged} semaine{summary.weeksLogged > 1 ? "s" : ""} saisie
          {summary.weeksLogged > 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
