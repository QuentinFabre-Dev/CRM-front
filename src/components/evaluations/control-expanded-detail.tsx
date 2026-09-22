"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, CheckSquare } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { applicableGroups, coverageFor, setGroupCheck } from "@/lib/assets";
import { Badge } from "@/components/ui/badge";
import { CriticalityIndicator, CriticalityLegend } from "@/components/ui/criticality-indicator";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatementView } from "@/components/evaluations/statement-view";
import { BASELINES, type AssessmentControl, type Control } from "@/lib/types";
import {
  useLang,
  controlStatement,
  controlDiscussion,
  controlObjectives,
  controlMethods,
  cisSafeguardTitle,
} from "@/lib/i18n";

export function ControlExpandedDetail({ control, ac }: { control: Control; ac: AssessmentControl }) {
  const { lang } = useLang();
  const [evidence, setEvidence] = useState(ac.evidence);

  useEffect(() => {
    setEvidence(ac.evidence);
    // Re-sync only when the row changes, not on every commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ac.id]);

  const toggleObjective = (objId: string) =>
    db.assessmentControls.update(ac.id, {
      objectiveChecks: { ...ac.objectiveChecks, [objId]: !ac.objectiveChecks[objId] },
      updatedAt: new Date().toISOString(),
    });

  const commitEvidence = () => {
    if (evidence === ac.evidence) return;
    db.assessmentControls.update(ac.id, { evidence, updatedAt: new Date().toISOString() });
  };

  const checkedCount = Object.values(ac.objectiveChecks).filter(Boolean).length;

  const assetGroups = useLiveQuery(
    () => db.assetGroups.where("assessmentId").equals(ac.assessmentId).toArray(),
    [ac.assessmentId],
    []
  );
  const assetMappings = useLiveQuery(
    () => db.controlAssetGroups.where("assessmentId").equals(ac.assessmentId).toArray(),
    [ac.assessmentId],
    []
  );

  const applicable = useMemo(
    () => applicableGroups(control.id, assetGroups ?? [], assetMappings ?? []),
    [control.id, assetGroups, assetMappings]
  );
  const coverage = coverageFor(applicable, ac.assetChecks);

  const cisSafeguards = useLiveQuery(async () => {
    const mapped = await db.cisMappings.where("controlId").equals(control.id).toArray();
    if (mapped.length === 0) return [];
    const found = await db.cisSafeguards.bulkGet(mapped.map((m) => m.safeguardId));
    return found
      .filter((sg): sg is NonNullable<typeof sg> => Boolean(sg))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [control.id], []);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Exigence</h4>
            {control.baselines.map((b) => (
              <Badge key={b}>{BASELINES.find((x) => x.id === b)?.label ?? b}</Badge>
            ))}
          </div>
          <StatementView parts={controlStatement(control, lang)} />
        </section>

        {controlDiscussion(control, lang) && (
          <section>
            <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Discussion</h4>
            <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-muted-foreground">
              {controlDiscussion(control, lang)}
            </p>
          </section>
        )}

        {controlMethods(control, lang).length > 0 && (
          <section>
            <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Méthodes d&apos;évaluation
            </h4>
            <div className="space-y-1.5">
              {controlMethods(control, lang).map((m, i) => (
                <div key={i} className="rounded-sm border border-border p-2 text-[11.5px]">
                  <Badge variant="outline" className="mb-1">
                    {m.method}
                  </Badge>
                  <p className="whitespace-pre-line text-muted-foreground">{m.objects}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(cisSafeguards ?? []).length > 0 && (
          <section>
            <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Safeguards CIS v8.1 correspondants
            </h4>
            <div className="space-y-1">
              {(cisSafeguards ?? []).map((sg) => (
                <div key={sg.id} className="flex items-start gap-2 rounded-sm border border-border p-2">
                  <Badge variant="outline" className="shrink-0">
                    {sg.id}
                  </Badge>
                  <span className="text-[11.5px] leading-snug">{cisSafeguardTitle(sg, lang)}</span>
                  <span className="ml-auto shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    IG{sg.ig}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="space-y-4">
        {controlObjectives(control, lang).length > 0 && (
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Objectifs d&apos;évaluation (800-53A)
              </h4>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckSquare size={12} />
                {checkedCount}/{controlObjectives(control, lang).length}
              </span>
            </div>
            <div className="mb-2">
              <CriticalityLegend />
            </div>
            <ul className="max-h-[320px] space-y-1.5 overflow-y-auto rounded-sm border border-border p-3">
              {controlObjectives(control, lang).map((obj) => (
                <li key={obj.id}>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(ac.objectiveChecks[obj.id])}
                      onChange={() => toggleObjective(obj.id)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-border accent-accent"
                    />
                    <CriticalityIndicator level={obj.riskCriticality} />
                    <span className="text-[12px] leading-snug">
                      <span className="mr-1 font-medium text-muted-foreground">{obj.label}</span>
                      {obj.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {coverage && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Couverture par catégorie d&apos;actifs
              </h4>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Boxes size={12} />
                {coverage.covered}/{coverage.total}
              </span>
            </div>
            <ul className="max-h-[240px] space-y-1.5 overflow-y-auto rounded-sm border border-border p-3">
              {applicable.map((group) => (
                <li key={group.id}>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(ac.assetChecks?.[group.id])}
                      onChange={(e) => setGroupCheck(ac.id, ac.assetChecks, group.id, e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-border accent-accent"
                    />
                    <span className="text-[12px] leading-snug">{group.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <Label>Preuves</Label>
          <Textarea
            rows={5}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            onBlur={commitEvidence}
            placeholder="Documents, extraits de configuration, entretiens, captures…"
          />
        </section>
      </div>
    </div>
  );
}
