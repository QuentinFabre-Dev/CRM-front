import Dexie, { type Table } from "dexie";
import type {
  Assessment,
  AssessmentControl,
  Asset,
  AssetGroup,
  AssetGroupMember,
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
  assessments!: Table<Assessment, string>;
  assessmentControls!: Table<AssessmentControl, string>;
  controlTemplates!: Table<ControlTemplate, string>;
  assets!: Table<Asset, string>;
  assetGroups!: Table<AssetGroup, string>;
  assetGroupMembers!: Table<AssetGroupMember, string>;
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
  }
}

export const db =
  typeof window !== "undefined" ? new ControlStudioDatabase() : (null as unknown as ControlStudioDatabase);

export interface AssessmentExportPayload {
  version: number;
  exportedAt: string;
  assessment: Assessment;
  assessmentControls: AssessmentControl[];
  /** Absents des exports v1 : traités comme des listes vides à l'import. */
  assets?: Asset[];
  assetGroups?: AssetGroup[];
  assetGroupMembers?: AssetGroupMember[];
  controlAssetGroups?: ControlAssetGroup[];
}

export const EXPORT_VERSION = 2;

const ASSESSMENT_TABLES = () => [
  db.assessments,
  db.assessmentControls,
  db.assets,
  db.assetGroups,
  db.assetGroupMembers,
  db.controlAssetGroups,
];

export async function exportAssessment(assessmentId: string): Promise<AssessmentExportPayload> {
  const assessment = await db.assessments.get(assessmentId);
  if (!assessment) throw new Error("Évaluation introuvable");

  const [assessmentControls, assets, assetGroups, controlAssetGroups] = await Promise.all([
    db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    db.assets.where("assessmentId").equals(assessmentId).toArray(),
    db.assetGroups.where("assessmentId").equals(assessmentId).toArray(),
    db.controlAssetGroups.where("assessmentId").equals(assessmentId).toArray(),
  ]);
  const groupIds = new Set(assetGroups.map((g) => g.id));
  const assetGroupMembers = (await db.assetGroupMembers.toArray()).filter((m) => groupIds.has(m.groupId));

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    assessment,
    assessmentControls,
    assets,
    assetGroups,
    assetGroupMembers,
    controlAssetGroups,
  };
}

export async function importAssessment(payload: AssessmentExportPayload): Promise<void> {
  await db.transaction("rw", ASSESSMENT_TABLES(), async () => {
    await db.assessments.put(payload.assessment);
    await db.assessmentControls.bulkPut(payload.assessmentControls);
    if (payload.assets?.length) await db.assets.bulkPut(payload.assets);
    if (payload.assetGroups?.length) await db.assetGroups.bulkPut(payload.assetGroups);
    if (payload.assetGroupMembers?.length) await db.assetGroupMembers.bulkPut(payload.assetGroupMembers);
    if (payload.controlAssetGroups?.length) await db.controlAssetGroups.bulkPut(payload.controlAssetGroups);
  });
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await db.transaction("rw", ASSESSMENT_TABLES(), async () => {
    await db.assessments.delete(assessmentId);
    const controlIds = await db.assessmentControls.where("assessmentId").equals(assessmentId).primaryKeys();
    await db.assessmentControls.bulkDelete(controlIds);

    const groupIds = await db.assetGroups.where("assessmentId").equals(assessmentId).primaryKeys();
    const memberIds = await db.assetGroupMembers.where("groupId").anyOf(groupIds).primaryKeys();
    const assetIds = await db.assets.where("assessmentId").equals(assessmentId).primaryKeys();
    const mappingIds = await db.controlAssetGroups.where("assessmentId").equals(assessmentId).primaryKeys();

    await Promise.all([
      db.assetGroups.bulkDelete(groupIds),
      db.assetGroupMembers.bulkDelete(memberIds),
      db.assets.bulkDelete(assetIds),
      db.controlAssetGroups.bulkDelete(mappingIds),
    ]);
  });
}
