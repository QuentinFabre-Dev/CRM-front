"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckSquare } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatementView } from "@/components/evaluations/statement-view";
import { MaturityPicker } from "@/components/evaluations/maturity-picker";
import { BASELINES } from "@/lib/types";

export function ControlDetailPanel({ assessmentId, controlId }: { assessmentId: string; controlId: string }) {
  const control = useLiveQuery(() => db.controls.get(controlId), [controlId]);
  const assessmentControl = useLiveQuery(
    () =>
      db.assessmentControls
        .where("[assessmentId+controlId]")
        .equals([assessmentId, controlId])
        .first(),
    [assessmentId, controlId]
  );

  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setEvidence(assessmentControl?.evidence ?? "");
    setNotes(assessmentControl?.notes ?? "");
    // Only re-sync when the record itself changes, not on every keystroke commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentControl?.id]);

  if (!control || !assessmentControl) return null;

  const setMaturity = (score: number) =>
    db.assessmentControls.update(assessmentControl.id, { maturityScore: score, updatedAt: new Date().toISOString() });

  const toggleObjective = (objId: string) =>
    db.assessmentControls.update(assessmentControl.id, {
      objectiveChecks: { ...assessmentControl.objectiveChecks, [objId]: !assessmentControl.objectiveChecks[objId] },
      updatedAt: new Date().toISOString(),
    });

  const commitEvidence = () => db.assessmentControls.update(assessmentControl.id, { evidence, updatedAt: new Date().toISOString() });
  const commitNotes = () => db.assessmentControls.update(assessmentControl.id, { notes, updatedAt: new Date().toISOString() });

  const checkedCount = Object.values(assessmentControl.objectiveChecks).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[16px] font-medium tracking-tight">
            {control.label} — {control.title}
          </h2>
          {control.isEnhancement && <Badge variant="outline">Enhancement</Badge>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {control.baselines.map((b) => (
            <Badge key={b}>{BASELINES.find((x) => x.id === b)?.label ?? b}</Badge>
          ))}
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Exigence</h3>
        <StatementView parts={control.statement} />
      </section>

      {control.discussion && (
        <section>
          <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Discussion</h3>
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">{control.discussion}</p>
        </section>
      )}

      {control.assessmentObjectives.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              Objectifs d&apos;évaluation (800-53A)
            </h3>
            <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
              <CheckSquare size={12} />
              {checkedCount}/{control.assessmentObjectives.length}
            </span>
          </div>
          <ul className="space-y-1.5 rounded-sm border border-border p-3">
            {control.assessmentObjectives.map((obj) => (
              <li key={obj.id}>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={Boolean(assessmentControl.objectiveChecks[obj.id])}
                    onChange={() => toggleObjective(obj.id)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-border accent-accent"
                  />
                  <span className="text-[12.5px] leading-snug">
                    <span className="mr-1 font-medium text-muted-foreground">{obj.label}</span>
                    {obj.text}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {control.assessmentMethods.length > 0 && (
        <section>
          <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Méthodes d&apos;évaluation
          </h3>
          <div className="space-y-2">
            {control.assessmentMethods.map((m, i) => (
              <div key={i} className="rounded-sm border border-border p-2.5 text-[12px]">
                <Badge variant="outline" className="mb-1">
                  {m.method}
                </Badge>
                <p className="whitespace-pre-line text-muted-foreground">{m.objects}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Niveau de maturité
        </h3>
        <MaturityPicker value={assessmentControl.maturityScore} onChange={setMaturity} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Preuves</Label>
          <Textarea
            rows={4}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            onBlur={commitEvidence}
            placeholder="Documents, extraits de configuration, captures…"
          />
        </div>
        <div>
          <Label>Notes de l&apos;évaluateur</Label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={commitNotes}
            placeholder="Observations, écarts, recommandations…"
          />
        </div>
      </section>
    </div>
  );
}
