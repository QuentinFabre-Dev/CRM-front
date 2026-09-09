"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAGES, type OpportunityStage } from "@/lib/types";
import { ORDINAL_BLUE, CHART_INK } from "@/lib/chart-colors";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: { title: string; amount: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { title, amount } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] shadow-popover">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground">{formatCurrency(amount)}</p>
    </div>
  );
}

export function PipelineChart({ byStage }: { byStage: Record<OpportunityStage, number> }) {
  const data = STAGES.map((s) => ({ title: s.title, amount: byStage[s.id] ?? 0 }));
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle>Pipeline par étape</CardTitle>
        <p className="text-[22px] font-semibold tracking-tight">{formatCurrency(total)}</p>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
            <XAxis
              dataKey="title"
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART_INK.secondary, fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => formatCompactCurrency(Number(v))}
              tick={{ fill: CHART_INK.secondary, fontSize: 11 }}
            />
            <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltip />} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {data.map((_, i) => (
                <Cell key={i} fill={ORDINAL_BLUE[i % ORDINAL_BLUE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
