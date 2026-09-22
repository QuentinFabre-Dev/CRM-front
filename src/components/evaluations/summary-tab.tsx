"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, FileSpreadsheet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { db, exportAssessment } from "@/lib/db";
import { exportAssessmentToExcel } from "@/lib/export-excel";
import { useLang } from "@/lib/i18n";
import { computeAssessmentStats } from "@/lib/assessment";
import { average, maturityColor } from "@/lib/maturity";
import { CHART_INK } from "@/lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; avg: number | null } }[] }) {
  if (!active || !payload?.length) return null;
  const { name, avg } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] shadow-popover">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{avg !== null ? `${avg}/5` : "Non évalué"}</p>
    </div>
  );
}

export function SummaryTab({ assessmentId }: { assessmentId: string }) {
  const { lang } = useLang();
  const assessmentControls = useLiveQuery(
    () => db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);
  const csfFunctions = useLiveQuery(() => db.csfFunctions.toArray(), [], []);
  const mappings = useLiveQuery(() => db.csfMappings.toArray(), [], []);
  const subcategories = useLiveQuery(() => db.csfSubcategories.toArray(), [], []);

  const controlById = useMemo(() => new Map((controls ?? []).map((c) => [c.id, c])), [controls]);
  const stats = useMemo(() => computeAssessmentStats(assessmentControls ?? []), [assessmentControls]);

  const byFamily = useMemo(() => {
    const groups = new Map<string, number[]>();
    for (const ac of assessmentControls ?? []) {
      const control = controlById.get(ac.controlId);
      if (!control || ac.maturityScore === null) continue;
      const key = control.familyTitle;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ac.maturityScore);
    }
    return [...groups.entries()]
      .map(([name, scores]) => ({ name, avg: average(scores) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assessmentControls, controlById]);

  const byFunction = useMemo(() => {
    const subToFunction = new Map((subcategories ?? []).map((s) => [s.id, s.functionId]));
    const scoreByControl = new Map((assessmentControls ?? []).map((ac) => [ac.controlId, ac.maturityScore]));
    const groups = new Map<string, number[]>();
    for (const m of mappings ?? []) {
      const score = scoreByControl.get(m.controlId);
      if (score === null || score === undefined) continue;
      const fnId = subToFunction.get(m.subcategoryId);
      if (!fnId) continue;
      if (!groups.has(fnId)) groups.set(fnId, []);
      groups.get(fnId)!.push(score);
    }
    return (csfFunctions ?? []).map((fn) => ({ name: fn.id, avg: average(groups.get(fn.id) ?? []) }));
  }, [mappings, subcategories, assessmentControls, csfFunctions]);

  const handleExport = async () => {
    const payload = await exportAssessment(assessmentId);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-${payload.assessment.clientName.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-3 sm:flex sm:gap-6">
          <div>
            <p className="text-[11px] text-muted-foreground">Complétude</p>
            <p className="text-[20px] font-medium tracking-tight">{stats.completion}%</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Contrôles évalués</p>
            <p className="text-[20px] font-medium tracking-tight">
              {stats.scored}/{stats.total}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Maturité moyenne</p>
            <p className="text-[20px] font-medium tracking-tight">
              {stats.averageMaturity !== null ? `${stats.averageMaturity}/5` : "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportAssessmentToExcel(assessmentId, lang)}>
            <FileSpreadsheet size={14} /> Exporter en Excel
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download size={14} /> Exporter le dossier (JSON)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maturité par famille SP 800-53</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byFamily} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={CHART_INK.gridline} />
              <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: CHART_INK.secondary, fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tickLine={false}
                axisLine={false}
                tick={{ fill: CHART_INK.secondary, fontSize: 11 }}
              />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltip />} />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {byFamily.map((d, i) => (
                  <Cell key={i} fill={maturityColor(d.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maturité par fonction NIST CSF 2.0</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byFunction} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: CHART_INK.secondary, fontSize: 11 }} />
              <YAxis domain={[0, 5]} tickLine={false} axisLine={false} width={28} tick={{ fill: CHART_INK.secondary, fontSize: 11 }} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltip />} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {byFunction.map((d, i) => (
                  <Cell key={i} fill={maturityColor(d.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
