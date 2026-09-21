import Dexie, { type Table } from "dexie";
import type {
  Assessment,
  AssessmentControl,
  Control,
  CsfCategory,
  CsfFunction,
  CsfMapping,
  CsfSubcategory,
} from "./types";

export class ControlStudioDatabase extends Dexie {
  controls!: Table<Control, string>;
  csfFunctions!: Table<CsfFunction, string>;
  csfCategories!: Table<CsfCategory, string>;
  csfSubcategories!: Table<CsfSubcategory, string>;
  csfMappings!: Table<CsfMapping, number>;
  assessments!: Table<Assessment, string>;
  assessmentControls!: Table<AssessmentControl, string>;

  constructor() {
    super("control-studio");
    this.version(1).stores({
      controls: "id, family, baseId, *baselines",
      csfFunctions: "id",
      csfCategories: "id, functionId",
      csfSubcategories: "id, categoryId, functionId",
      csfMappings: "++id, subcategoryId, controlId",
      assessments: "id, createdAt",
      assessmentControls: "id, assessmentId, controlId, [assessmentId+controlId]",
    });
  }
}

export const db =
  typeof window !== "undefined" ? new ControlStudioDatabase() : (null as unknown as ControlStudioDatabase);

export interface AssessmentExportPayload {
  version: number;
  exportedAt: string;
  assessment: Assessment;
  assessmentControls: AssessmentControl[];
}

export const EXPORT_VERSION = 1;

export async function exportAssessment(assessmentId: string): Promise<AssessmentExportPayload> {
  const assessment = await db.assessments.get(assessmentId);
  if (!assessment) throw new Error("Évaluation introuvable");
  const assessmentControls = await db.assessmentControls.where("assessmentId").equals(assessmentId).toArray();
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    assessment,
    assessmentControls,
  };
}

export async function importAssessment(payload: AssessmentExportPayload): Promise<void> {
  await db.transaction("rw", [db.assessments, db.assessmentControls], async () => {
    await db.assessments.put(payload.assessment);
    await db.assessmentControls.bulkPut(payload.assessmentControls);
  });
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await db.transaction("rw", [db.assessments, db.assessmentControls], async () => {
    await db.assessments.delete(assessmentId);
    const ids = await db.assessmentControls.where("assessmentId").equals(assessmentId).primaryKeys();
    await db.assessmentControls.bulkDelete(ids);
  });
}
