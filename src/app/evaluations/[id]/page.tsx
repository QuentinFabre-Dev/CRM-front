"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { computeAssessmentStats } from "@/lib/assessment";
import { BASELINES } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ControlsTable } from "@/components/evaluations/controls-table";
import { CsfTab } from "@/components/evaluations/csf-tab";
import { SummaryTab } from "@/components/evaluations/summary-tab";

export default function AssessmentPage({ params }: { params: { id: string } }) {
  const assessmentId = params.id;
  const assessment = useLiveQuery(() => db.assessments.get(assessmentId), [assessmentId]);
  const assessmentControls = useLiveQuery(
    () => db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const [focusControlId, setFocusControlId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("controles");

  const jumpToControl = (controlId: string) => {
    setFocusControlId(controlId);
    setActiveTab("controles");
  };

  const clearFocus = useCallback(() => setFocusControlId(null), []);

  const stats = useMemo(() => computeAssessmentStats(assessmentControls ?? []), [assessmentControls]);

  if (assessment === undefined) return null;
  if (assessment === null) return <p className="text-[13px] text-muted-foreground">Évaluation introuvable.</p>;

  const baselineLabel = BASELINES.find((b) => b.id === assessment.baseline)?.label ?? assessment.baseline;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Évaluations
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[20px] font-medium tracking-tight">{assessment.clientName}</h1>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Baseline {baselineLabel}
              {assessment.assessor ? ` · ${assessment.assessor}` : ""}
            </p>
          </div>
          <div className="w-full max-w-[220px]">
            <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>Complétude</span>
              <span>
                {stats.scored}/{stats.total}
              </span>
            </div>
            <Progress value={stats.completion} className="mt-1" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="self-start">
          <TabsTrigger value="controles">Contrôles</TabsTrigger>
          <TabsTrigger value="csf">CSF 2.0</TabsTrigger>
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
        </TabsList>

        <TabsContent value="controles" className="flex-1 overflow-hidden">
          <ControlsTable
            assessmentId={assessmentId}
            focusControlId={focusControlId}
            onFocusHandled={clearFocus}
          />
        </TabsContent>

        <TabsContent value="csf" className="flex-1 overflow-y-auto">
          <CsfTab assessmentId={assessmentId} onJumpToControl={jumpToControl} />
        </TabsContent>

        <TabsContent value="synthese" className="flex-1 overflow-y-auto">
          <SummaryTab assessmentId={assessmentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
