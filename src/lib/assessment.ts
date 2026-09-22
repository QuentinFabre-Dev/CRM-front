import { db } from "./db";
import { uid, type Baseline } from "./types";

export interface CreateAssessmentInput {
  clientName: string;
  assessor: string;
  /** Périmètre : soit une baseline NIST SP 800-53B, soit un modèle personnalisé. */
  scope: { kind: "baseline"; baseline: Baseline } | { kind: "template"; templateId: string };
}

export async function createAssessment(input: CreateAssessmentInput): Promise<string> {
  const assessmentId = uid();
  const now = new Date().toISOString();

  let controls;
  let baseline: Baseline;
  let templateId: string | undefined;
  let templateName: string | undefined;

  if (input.scope.kind === "template") {
    const template = await db.controlTemplates.get(input.scope.templateId);
    if (!template) throw new Error("Modèle introuvable");
    controls = (await db.controls.bulkGet(template.controlIds)).filter((c) => c !== undefined);
    // La baseline reste stockée pour l'affichage/les exports : on retient la plus
    // représentée parmi les contrôles du modèle, à défaut "moderate".
    baseline = dominantBaseline(controls) ?? "moderate";
    templateId = template.id;
    templateName = template.name;
  } else {
    baseline = input.scope.baseline;
    controls = await db.controls.where("baselines").equals(baseline).toArray();
  }

  await db.transaction("rw", [db.assessments, db.assessmentControls], async () => {
    await db.assessments.add({
      id: assessmentId,
      clientName: input.clientName.trim(),
      baseline,
      assessor: input.assessor.trim(),
      createdAt: now,
      status: "in-progress",
      ...(templateId ? { templateId, templateName } : {}),
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

function dominantBaseline(controls: { baselines: Baseline[] }[]): Baseline | null {
  const counts = new Map<Baseline, number>();
  for (const c of controls) {
    for (const b of c.baselines) counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  let best: Baseline | null = null;
  let bestCount = 0;
  for (const [b, n] of counts) {
    if (n > bestCount) {
      best = b;
      bestCount = n;
    }
  }
  return best;
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
