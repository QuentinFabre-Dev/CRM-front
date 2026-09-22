import Dexie, { type Table } from "dexie";
import type {
  Assessment,
  AssessmentControl,
  AssetGroup,
  CisControl,
  CisMapping,
  CisSafeguard,
  Control,
  ControlAssetGroup,
  ControlTemplate,
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
  cisControls!: Table<CisControl, number>;
  cisSafeguards!: Table<CisSafeguard, string>;
  cisMappings!: Table<CisMapping, number>;
  assessments!: Table<Assessment, string>;
  assessmentControls!: Table<AssessmentControl, string>;
  controlTemplates!: Table<ControlTemplate, string>;
  assetGroups!: Table<AssetGroup, string>;
  controlAssetGroups!: Table<ControlAssetGroup, string>;

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
    this.version(2).stores({
      controlTemplates: "id, name, updatedAt",
    });
    this.version(3).stores({
      assets: "id, assessmentId, name",
      assetGroups: "id, assessmentId, name",
      assetGroupMembers: "id, groupId, assetId, [groupId+assetId]",
      controlAssetGroups: "id, assessmentId, controlId, groupId, [assessmentId+controlId], [groupId+controlId]",
    });
    // L'évaluation raisonne à la maille catégorie d'actifs : la table d'instances
    // et son join n'ont plus d'objet.
    this.version(4).stores({
      assets: null,
      assetGroupMembers: null,
    });
    this.version(5).stores({
      cisControls: "number",
      cisSafeguards: "id, controlNumber, ig",
      cisMappings: "++id, safeguardId, controlId",
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
  /** Absents des exports antérieurs : traités comme des listes vides à l'import. */
  assetGroups?: AssetGroup[];
  controlAssetGroups?: ControlAssetGroup[];
}

export const EXPORT_VERSION = 3;

const ASSESSMENT_TABLES = () => [
  db.assessments,
  db.assessmentControls,
  db.assetGroups,
  db.controlAssetGroups,
];

export async function exportAssessment(assessmentId: string): Promise<AssessmentExportPayload> {
  const assessment = await db.assessments.get(assessmentId);
  if (!assessment) throw new Error("Évaluation introuvable");

  const [assessmentControls, assetGroups, controlAssetGroups] = await Promise.all([
    db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    db.assetGroups.where("assessmentId").equals(assessmentId).toArray(),
    db.controlAssetGroups.where("assessmentId").equals(assessmentId).toArray(),
  ]);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    assessment,
    assessmentControls,
    assetGroups,
    controlAssetGroups,
  };
}

export async function importAssessment(payload: AssessmentExportPayload): Promise<void> {
  await db.transaction("rw", ASSESSMENT_TABLES(), async () => {
    await db.assessments.put(payload.assessment);
    await db.assessmentControls.bulkPut(payload.assessmentControls);
    if (payload.assetGroups?.length) await db.assetGroups.bulkPut(payload.assetGroups);
    if (payload.controlAssetGroups?.length) await db.controlAssetGroups.bulkPut(payload.controlAssetGroups);
  });
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await db.transaction("rw", ASSESSMENT_TABLES(), async () => {
    await db.assessments.delete(assessmentId);
    const controlIds = await db.assessmentControls.where("assessmentId").equals(assessmentId).primaryKeys();
    const groupIds = await db.assetGroups.where("assessmentId").equals(assessmentId).primaryKeys();
    const mappingIds = await db.controlAssetGroups.where("assessmentId").equals(assessmentId).primaryKeys();

    await Promise.all([
      db.assessmentControls.bulkDelete(controlIds),
      db.assetGroups.bulkDelete(groupIds),
      db.controlAssetGroups.bulkDelete(mappingIds),
    ]);
  });
}
