"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { UserPlus, Briefcase, Euro, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { STAGES, type OpportunityStage } from "@/lib/types";
import { getPeriodRange, getPreviousPeriodRange, isWithin, percentDelta, type PeriodKey } from "@/lib/period";
import { getFiscalYearRange, summarizeChargeability } from "@/lib/fiscal-year";
import { getOverdueContacts } from "@/lib/relances";
import { formatCurrency } from "@/lib/format";
import { CATEGORICAL } from "@/lib/chart-colors";
import { PeriodTabs } from "@/components/dashboard/period-tabs";
import { StatCard } from "@/components/dashboard/stat-card";
import { EisenhowerMini } from "@/components/dashboard/eisenhower-mini";
import { PipelineCompact } from "@/components/dashboard/pipeline-compact";
import { SourcesBreakdown } from "@/components/dashboard/sources-breakdown";
import { ChargeabilityWidget } from "@/components/dashboard/chargeability-widget";
import { RelancesWidget } from "@/components/dashboard/relances-widget";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>("week");

  const contacts = useLiveQuery(() => db.contacts.toArray(), [], []);
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), [], []);
  const interactions = useLiveQuery(() => db.interactions.toArray(), [], []);
  const weekly = useLiveQuery(() => db.weeklyChargeability.toArray(), [], []);
  const targets = useLiveQuery(() => db.targets.toArray(), [], []);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPreviousPeriodRange(period), [period]);

  const newContacts = (contacts ?? []).filter((c) => isWithin(c.createdAt, range)).length;
  const prevNewContacts = (contacts ?? []).filter((c) => isWithin(c.createdAt, prevRange)).length;

  const newOpps = (opportunities ?? []).filter((o) => isWithin(o.createdAt, range)).length;
  const prevNewOpps = (opportunities ?? []).filter((o) => isWithin(o.createdAt, prevRange)).length;

  const openOpps = (opportunities ?? []).filter((o) => o.outcome === "open");
  const pipelineTotal = openOpps.reduce((sum, o) => sum + o.amount, 0);
  const pipelineAddedInPeriod = openOpps
    .filter((o) => isWithin(o.createdAt, range))
    .reduce((sum, o) => sum + o.amount, 0);
  const pipelineDelta = pipelineTotal > 0 ? Math.round((pipelineAddedInPeriod / pipelineTotal) * 100) : null;

  const wonInPeriod = (opportunities ?? []).filter((o) => o.outcome === "won" && isWithin(o.updatedAt, range)).length;
  const wonInPrevPeriod = (opportunities ?? []).filter(
    (o) => o.outcome === "won" && isWithin(o.updatedAt, prevRange)
  ).length;

  const byStage = (opportunities ?? [])
    .filter((o) => o.outcome !== "lost")
    .reduce((acc, o) => {
      acc[o.stage] = (acc[o.stage] ?? 0) + o.amount;
      return acc;
    }, {} as Record<OpportunityStage, number>);

  const sourceCounts = (opportunities ?? []).reduce((acc, o) => {
    const key = o.source ?? "Autres";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fiscalYear = getFiscalYearRange();
  const chargeabilitySummary = summarizeChargeability(weekly ?? [], fiscalYear);
  const chargeabilityTarget = (targets ?? []).find((t) => t.type === "chargeabilite")?.value ?? 80;

  const overdue = getOverdueContacts(contacts ?? [], interactions ?? []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight">{greeting}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Voici ce qui se passe dans votre CRM.</p>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UserPlus}
          label="Nouveaux prospects"
          value={String(newContacts)}
          delta={percentDelta(newContacts, prevNewContacts)}
          tint={CATEGORICAL[0]}
        />
        <StatCard
          icon={Briefcase}
          label="Nouvelles opportunités"
          value={String(newOpps)}
          delta={percentDelta(newOpps, prevNewOpps)}
          tint={CATEGORICAL[6]}
        />
        <StatCard
          icon={Euro}
          label="Pipeline"
          value={formatCurrency(pipelineTotal)}
          delta={pipelineDelta}
          deltaLabel="ajoutés sur la période"
          tint={CATEGORICAL[2]}
        />
        <StatCard
          icon={Trophy}
          label="Affaires remportées"
          value={String(wonInPeriod)}
          delta={percentDelta(wonInPeriod, wonInPrevPeriod)}
          tint={CATEGORICAL[1]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <EisenhowerMini />
        </div>
        <RelancesWidget overdue={overdue} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PipelineCompact byStage={byStage} />
        <SourcesBreakdown counts={sourceCounts} />
        <ChargeabilityWidget summary={chargeabilitySummary} target={chargeabilityTarget} fiscalYear={fiscalYear} />
      </div>

      <ActivityFeed />
    </div>
  );
}
