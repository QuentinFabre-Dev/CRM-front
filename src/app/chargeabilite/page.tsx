"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { startOfWeek, format, isSameWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2, Pencil } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { db } from "@/lib/db";
import { uid } from "@/lib/types";
import { getFiscalYearRange, isInFiscalYear, summarizeChargeability } from "@/lib/fiscal-year";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDINAL_BLUE, CHART_INK, STATUS } from "@/lib/chart-colors";

export default function ChargeabilitePage() {
  const entries = useLiveQuery(() => db.weeklyChargeability.toArray(), [], []);
  const targets = useLiveQuery(() => db.targets.toArray(), [], []);
  const target = (targets ?? []).find((t) => t.type === "chargeabilite")?.value ?? 80;

  const fiscalYear = getFiscalYearRange();
  const summary = summarizeChargeability(entries ?? [], fiscalYear);

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const existingCurrent = (entries ?? []).find((e) => isSameWeek(new Date(e.weekStart), currentWeekStart, { weekStartsOn: 1 }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [chargeable, setChargeable] = useState(existingCurrent ? String(existingCurrent.chargeableHours) : "");
  const [total, setTotal] = useState(existingCurrent ? String(existingCurrent.totalHours) : "");
  const [weekStart, setWeekStart] = useState(format(currentWeekStart, "yyyy-MM-dd"));

  const yearEntries = useMemo(
    () =>
      (entries ?? [])
        .filter((e) => isInFiscalYear(e.weekStart, fiscalYear))
        .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1)),
    [entries, fiscalYear]
  );

  const chartData = yearEntries.map((e) => ({
    label: format(new Date(e.weekStart), "dd/MM"),
    pct: e.totalHours > 0 ? Math.round((e.chargeableHours / e.totalHours) * 100) : 0,
  }));

  const resetForm = () => {
    setEditingId(null);
    setChargeable("");
    setTotal("");
    setWeekStart(format(currentWeekStart, "yyyy-MM-dd"));
  };

  const startEdit = (id: string) => {
    const entry = (entries ?? []).find((e) => e.id === id);
    if (!entry) return;
    setEditingId(id);
    setChargeable(String(entry.chargeableHours));
    setTotal(String(entry.totalHours));
    setWeekStart(format(new Date(entry.weekStart), "yyyy-MM-dd"));
  };

  const save = async () => {
    const chargeableHours = Number(chargeable);
    const totalHours = Number(total);
    if (!totalHours || chargeableHours < 0) return;
    const iso = startOfWeek(new Date(weekStart), { weekStartsOn: 1 }).toISOString();

    if (editingId) {
      await db.weeklyChargeability.update(editingId, { chargeableHours, totalHours, weekStart: iso });
    } else {
      const dup = (entries ?? []).find((e) => isSameWeek(new Date(e.weekStart), new Date(weekStart), { weekStartsOn: 1 }));
      if (dup) {
        await db.weeklyChargeability.update(dup.id, { chargeableHours, totalHours });
      } else {
        await db.weeklyChargeability.add({
          id: uid(),
          weekStart: iso,
          chargeableHours,
          totalHours,
          createdAt: new Date().toISOString(),
        });
      }
    }
    resetForm();
  };

  const remove = async (id: string) => {
    await db.weeklyChargeability.delete(id);
    if (editingId === id) resetForm();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Chargeabilité</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Objectif {target}% de chargeable sur l&apos;année fiscale {fiscalYear.label}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <p className="text-[13px] text-muted-foreground">Cumul année fiscale</p>
          <p
            className="mt-1 text-[36px] font-medium tracking-tight"
            style={{ color: summary.percentage >= target ? STATUS.good : "inherit" }}
          >
            {summary.percentage}%
          </p>
          <div className="relative mt-3 h-2.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, summary.percentage)}%`, backgroundColor: ORDINAL_BLUE[3] }}
            />
            <div
              className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-foreground/60"
              style={{ left: `${Math.min(100, target)}%` }}
            />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {summary.chargeableHours}h chargeables / {summary.totalHours}h totales · {summary.weeksLogged} semaine
            {summary.weeksLogged > 1 ? "s" : ""} saisie{summary.weeksLogged > 1 ? "s" : ""}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{editingId ? "Modifier la semaine" : "Saisir la semaine"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label>Semaine (lundi)</Label>
                <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
              </div>
              <div>
                <Label>Heures chargeables</Label>
                <Input type="number" min={0} value={chargeable} onChange={(e) => setChargeable(e.target.value)} />
              </div>
              <div>
                <Label>Heures totales</Label>
                <Input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={save}>{editingId ? "Mettre à jour" : "Enregistrer la semaine"}</Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution hebdomadaire</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Aucune semaine saisie pour le moment.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: CHART_INK.secondary, fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: CHART_INK.secondary, fontSize: 11 }}
                />
                <ReferenceLine y={target} stroke={STATUS.good} strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(value: number) => [`${value}%`, "Chargeabilité"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={28} fill={ORDINAL_BLUE[3]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[...yearEntries].reverse().map((entry) => {
            const pct = entry.totalHours > 0 ? Math.round((entry.chargeableHours / entry.totalHours) * 100) : 0;
            return (
              <div key={entry.id} className="flex items-center justify-between rounded-md px-2 py-2 -mx-2 hover:bg-muted">
                <div>
                  <p className="text-[13px] font-medium">
                    Semaine du {format(new Date(entry.weekStart), "d MMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {entry.chargeableHours}h / {entry.totalHours}h · {pct}%
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(entry.id)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(entry.id)}>
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              </div>
            );
          })}
          {yearEntries.length === 0 && <p className="text-[13px] text-muted-foreground">Aucune donnée.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
