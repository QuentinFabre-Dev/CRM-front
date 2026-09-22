"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { db, deleteAssessment } from "@/lib/db";
import { computeAssessmentStats } from "@/lib/assessment";
import { BASELINES } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AssessmentFormDialog } from "@/components/evaluations/assessment-form-dialog";
import { maturityColor } from "@/lib/maturity";

export default function HomePage() {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const assessments = useLiveQuery(() => db.assessments.toArray(), [], []);
  const assessmentControls = useLiveQuery(() => db.assessmentControls.toArray(), [], []);

  const statsByAssessment = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeAssessmentStats>>();
    for (const a of assessments ?? []) {
      map.set(
        a.id,
        computeAssessmentStats((assessmentControls ?? []).filter((ac) => ac.assessmentId === a.id))
      );
    }
    return map;
  }, [assessments, assessmentControls]);

  const remove = async (id: string) => {
    await deleteAssessment(id);
    setConfirmId(null);
  };

  const sorted = [...(assessments ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight">Évaluations</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {sorted.length} dossier(s) client — NIST SP 800-53 Rev 5 mappé à CSF 2.0
          </p>
        </div>
        <AssessmentFormDialog />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((a) => {
          const stats = statsByAssessment.get(a.id);
          const baselineLabel = a.templateName ?? BASELINES.find((b) => b.id === a.baseline)?.label ?? a.baseline;
          return (
            <Card key={a.id} className="relative p-4">
              <Link href={`/evaluations/${a.id}`} className="block">
                <div className="flex items-start justify-between gap-2 pr-8">
                  <p className="truncate text-[14px] font-medium">{a.clientName}</p>
                  <Badge variant="outline">{baselineLabel}</Badge>
                </div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {a.assessor ? `${a.assessor} · ` : ""}
                  créé {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: fr })}
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                    <span>Complétude</span>
                    <span>
                      {stats?.scored ?? 0}/{stats?.total ?? 0}
                    </span>
                  </div>
                  <Progress value={stats?.completion ?? 0} className="mt-1" />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: maturityColor(stats?.averageMaturity ?? null) }}
                  />
                  <span className="text-[12.5px] font-medium">
                    {stats?.averageMaturity !== null && stats?.averageMaturity !== undefined
                      ? `Maturité moyenne ${stats.averageMaturity}/5`
                      : "Pas encore évalué"}
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setConfirmId(a.id)}
              >
                <Trash2 size={14} className="text-danger" />
              </Button>

              {confirmId === a.id && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-surface/95 p-4 text-center">
                  <p className="text-[13px]">Supprimer « {a.clientName} » ?</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                      Annuler
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => remove(a.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {sorted.length === 0 && (
          <p className="col-span-full text-[13px] text-muted-foreground">
            Aucune évaluation pour le moment — créez-en une pour commencer.
          </p>
        )}
      </div>
    </div>
  );
}
