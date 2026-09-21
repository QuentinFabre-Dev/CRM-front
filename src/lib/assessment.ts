import { db } from "./db";
import { uid, type Baseline } from "./types";

export async function createAssessment(clientName: string, assessor: string, baseline: Baseline): Promise<string> {
  const assessmentId = uid();
  const now = new Date().toISOString();
  const controls = await db.controls.where("baselines").equals(baseline).toArray();

  await db.transaction("rw", [db.assessments, db.assessmentControls], async () => {
    await db.assessments.add({
      id: assessmentId,
      clientName: clientName.trim(),
      baseline,
      assessor: assessor.trim(),
      createdAt: now,
      status: "in-progress",
    });
    await db.assessmentControls.bulkAdd(
      controls.map((control) => ({
        id: uid(),
        assessmentId,
        controlId: control.id,
        maturityScore: null,
        objectiveChecks: {},
        evidence: "",
        notes: "",
        updatedAt: now,
      }))
    );
  });

  return assessmentId;
}

export interface AssessmentStats {
  total: number;
  scored: number;
  completion: number;
  averageMaturity: number | null;
}

export function computeAssessmentStats(
  assessmentControls: { maturityScore: number | null }[]
): AssessmentStats {
  const total = assessmentControls.length;
  const scored = assessmentControls.filter((ac) => ac.maturityScore !== null).length;
  const completion = total > 0 ? Math.round((scored / total) * 100) : 0;
  const validScores = assessmentControls
    .map((ac) => ac.maturityScore)
    .filter((s): s is number => s !== null);
  const averageMaturity =
    validScores.length > 0
      ? Math.round((validScores.reduce((sum, s) => sum + s, 0) / validScores.length) * 10) / 10
      : null;
  return { total, scored, completion, averageMaturity };
}
