"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { applicableGroups } from "@/lib/assets";
import { BASELINES } from "@/lib/types";
import { useLang, controlTitle, controlObjectives, controlStatement } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CriticalityLegend } from "@/components/ui/criticality-indicator";
import { MaturityPicker } from "@/components/evaluations/maturity-picker";
import { StatementView } from "@/components/evaluations/statement-view";
import { DeploymentMatrix } from "@/components/evaluations/deployment-matrix";

export default function ControlWorkspacePage({ params }: { params: { id: string; controlId: string } }) {
  const assessmentId = params.id;
  const controlId = decodeURIComponent(params.controlId);
  const { lang } = useLang();

  const assessment = useLiveQuery(() => db.assessments.get(assessmentId), [assessmentId]);
  const control = useLiveQuery(() => db.controls.get(controlId), [controlId]);
  const ac = useLiveQuery(
    async () =>
      (await db.assessmentControls.where("[assessmentId+controlId]").equals([assessmentId, controlId]).first()) ?? null,
    [assessmentId, controlId]
  );
  const assetGroups = useLiveQuery(
    () => db.assetGroups.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const assetMappings = useLiveQuery(
    () => db.controlAssetGroups.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );

  const applicable = useMemo(
    () => applicableGroups(controlId, assetGroups ?? [], assetMappings ?? []),
    [controlId, assetGroups, assetMappings]
  );
  const otherGroups = useMemo(() => {
    const applicableIds = new Set(applicable.map((g) => g.id));
    return (assetGroups ?? []).filter((g) => !applicableIds.has(g.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [assetGroups, applicable]);

  // Plusieurs contrôles ouverts en parallèle : l'onglet du navigateur doit dire lequel.
  useEffect(() => {
    if (control && assessment) document.title = `${control.label} · ${assessment.clientName} — Control Studio`;
  }, [control, assessment]);

  if (assessment === undefined || control === undefined || ac === undefined) return null;
  if (!assessment || !control || !ac) {
    return (
      <div className="space-y-3">
        <Link href={`/evaluations/${assessmentId}`} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Retour à l&apos;évaluation
        </Link>
        <p className="text-[13px] text-muted-foreground">
          {!assessment
            ? "Évaluation introuvable."
            : !control
              ? "Contrôle introuvable dans le référentiel."
              : "Ce contrôle n'est pas dans le périmètre de cette évaluation."}
        </p>
      </div>
    );
  }

  const objectives = controlObjectives(control, lang);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/evaluations/${assessmentId}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> {assessment.clientName}
        </Link>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[20px] font-medium tracking-tight">
              {control.label} — {controlTitle(control, lang)}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {control.baselines.map((b) => (
                <Badge key={b}>{BASELINES.find((x) => x.id === b)?.label ?? b}</Badge>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 lg:w-[420px]">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Maturité</p>
            <MaturityPicker
              value={ac.maturityScore}
              onChange={(score) =>
                db.assessmentControls.update(ac.id, { maturityScore: score, updatedAt: new Date().toISOString() })
              }
            />
          </div>
        </div>
      </div>

      <details className="rounded-md border border-border bg-surface p-4">
        <summary className="cursor-pointer text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Exigence
        </summary>
        <div className="mt-3">
          <StatementView parts={controlStatement(control, lang)} />
        </div>
      </details>

      <section className="space-y-2">
        <div>
          <h2 className="text-[14px] font-medium">Déploiement par catégorie d&apos;actifs</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Pour chaque objectif d&apos;évaluation, le niveau de déploiement constaté sur chaque catégorie d&apos;actifs
            concernée par le contrôle.
          </p>
        </div>
        {objectives.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Ce contrôle n&apos;a pas d&apos;objectif d&apos;évaluation 800-53A.</p>
        ) : (assetGroups ?? []).length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-5 text-center text-[13px] text-muted-foreground">
            Aucune catégorie d&apos;actifs n&apos;est définie pour cette évaluation. Créez-les depuis l&apos;onglet{" "}
            <Link href={`/evaluations/${assessmentId}`} className="text-accent hover:underline">
              Actifs
            </Link>
            .
          </div>
        ) : (
          <>
            <CriticalityLegend />
            <DeploymentMatrix ac={ac} objectives={objectives} applicable={applicable} otherGroups={otherGroups} />
          </>
        )}
      </section>

      <EvidenceAndNotes key={ac.id} acId={ac.id} evidence={ac.evidence} notes={ac.notes} />
    </div>
  );
}

function EvidenceAndNotes({ acId, evidence: initialEvidence, notes: initialNotes }: { acId: string; evidence: string; notes: string }) {
  const [evidence, setEvidence] = useState(initialEvidence);
  const [notes, setNotes] = useState(initialNotes);

  const commit = (field: "evidence" | "notes", value: string, original: string) => {
    if (value === original) return;
    const updatedAt = new Date().toISOString();
    db.assessmentControls.update(acId, field === "evidence" ? { evidence: value, updatedAt } : { notes: value, updatedAt });
  };

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <Label>Preuves</Label>
        <Textarea
          rows={5}
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          onBlur={() => commit("evidence", evidence, initialEvidence)}
          placeholder="Documents, extraits de configuration, entretiens, captures…"
        />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => commit("notes", notes, initialNotes)}
          placeholder="Constats, écarts, points à confirmer…"
        />
      </div>
    </section>
  );
}
