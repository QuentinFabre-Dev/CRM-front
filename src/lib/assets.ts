import { db } from "./db";
import { DEFAULT_ASSET_GROUPS, defaultGroupKeysForFamily } from "./asset-mapping";
import {
  uid,
  type AssessmentControl,
  type AssetGroup,
  type ControlAssetGroup,
  type DeploymentLevel,
} from "./types";

export async function createAssetGroup(
  assessmentId: string,
  name: string,
  description = "",
  templateKey?: string
): Promise<string> {
  const id = uid();
  await db.assetGroups.add({
    id,
    assessmentId,
    name: name.trim(),
    description: description.trim(),
    ...(templateKey ? { templateKey } : {}),
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function renameAssetGroup(groupId: string, name: string, description: string): Promise<void> {
  await db.assetGroups.update(groupId, { name: name.trim(), description: description.trim() });
}

export async function deleteAssetGroup(groupId: string): Promise<void> {
  await db.transaction("rw", [db.assetGroups, db.controlAssetGroups], async () => {
    await db.assetGroups.delete(groupId);
    const mappingIds = await db.controlAssetGroups.where("groupId").equals(groupId).primaryKeys();
    await db.controlAssetGroups.bulkDelete(mappingIds);
  });
}

/** Remplace l'ensemble des contrôles applicables à un groupe. */
export async function setGroupControls(assessmentId: string, groupId: string, controlIds: string[]): Promise<void> {
  await db.transaction("rw", [db.controlAssetGroups], async () => {
    const existingIds = await db.controlAssetGroups.where("groupId").equals(groupId).primaryKeys();
    await db.controlAssetGroups.bulkDelete(existingIds);
    if (controlIds.length) {
      await db.controlAssetGroups.bulkAdd(
        controlIds.map((controlId) => ({ id: uid(), assessmentId, groupId, controlId }))
      );
    }
  });
}

export async function setGroupCheck(
  assessmentControlId: string,
  current: Record<string, boolean> | undefined,
  groupId: string,
  checked: boolean
): Promise<void> {
  await db.assessmentControls.update(assessmentControlId, {
    assetChecks: { ...(current ?? {}), [groupId]: checked },
    updatedAt: new Date().toISOString(),
  });
}

export interface DefaultMappingResult {
  groupsCreated: number;
  controlsMapped: number;
}

/**
 * Crée les catégories standard manquantes puis remplace le mapping de
 * l'évaluation par la proposition famille → catégories d'actifs.
 */
export async function applyDefaultMapping(assessmentId: string): Promise<DefaultMappingResult> {
  const [existingGroups, assessmentControls, controls] = await Promise.all([
    db.assetGroups.where("assessmentId").equals(assessmentId).toArray(),
    db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    db.controls.toArray(),
  ]);

  const familyByControlId = new Map(controls.map((c) => [c.id, c.family]));
  const groupIdByKey = new Map(
    existingGroups.filter((g) => g.templateKey).map((g) => [g.templateKey as string, g.id])
  );

  const toCreate = DEFAULT_ASSET_GROUPS.filter((t) => !groupIdByKey.has(t.key));
  const now = new Date().toISOString();
  const newGroups: AssetGroup[] = toCreate.map((t) => {
    const id = uid();
    groupIdByKey.set(t.key, id);
    return { id, assessmentId, name: t.name, description: t.description, templateKey: t.key, createdAt: now };
  });

  const mappings: ControlAssetGroup[] = [];
  const mappedControls = new Set<string>();
  for (const ac of assessmentControls) {
    const family = familyByControlId.get(ac.controlId);
    if (!family) continue;
    for (const key of defaultGroupKeysForFamily(family)) {
      const groupId = groupIdByKey.get(key);
      if (!groupId) continue;
      mappings.push({ id: uid(), assessmentId, controlId: ac.controlId, groupId });
      mappedControls.add(ac.controlId);
    }
  }

  await db.transaction("rw", [db.assetGroups, db.controlAssetGroups], async () => {
    if (newGroups.length) await db.assetGroups.bulkAdd(newGroups);
    const staleIds = await db.controlAssetGroups.where("assessmentId").equals(assessmentId).primaryKeys();
    await db.controlAssetGroups.bulkDelete(staleIds);
    if (mappings.length) await db.controlAssetGroups.bulkAdd(mappings);
  });

  return { groupsCreated: newGroups.length, controlsMapped: mappedControls.size };
}

/**
 * Catégories d'actifs concernées par un contrôle. Vide pour un contrôle
 * organisationnel : la section couverture reste alors masquée.
 */
export function applicableGroups(
  controlId: string,
  groups: AssetGroup[],
  mappings: ControlAssetGroup[]
): AssetGroup[] {
  const groupIds = new Set(mappings.filter((m) => m.controlId === controlId).map((m) => m.groupId));
  if (groupIds.size === 0) return [];
  return groups.filter((g) => groupIds.has(g.id)).sort((a, b) => a.name.localeCompare(b.name));
}

export function coverageFor(
  applicable: AssetGroup[],
  assetChecks: Record<string, boolean> | undefined
): { covered: number; total: number } | null {
  if (applicable.length === 0) return null;
  return {
    covered: applicable.filter((g) => assetChecks?.[g.id]).length,
    total: applicable.length,
  };
}

export async function setControlGroupApplicable(
  assessmentId: string,
  controlId: string,
  groupId: string,
  applicable: boolean
): Promise<void> {
  await db.transaction("rw", [db.controlAssetGroups], async () => {
    const existing = await db.controlAssetGroups
      .where("[assessmentId+controlId]")
      .equals([assessmentId, controlId])
      .filter((m) => m.groupId === groupId)
      .primaryKeys();
    if (applicable && existing.length === 0) {
      await db.controlAssetGroups.add({ id: uid(), assessmentId, controlId, groupId });
    } else if (!applicable && existing.length > 0) {
      await db.controlAssetGroups.bulkDelete(existing);
    }
  });
}

/**
 * Écrit des cellules de la matrice. La ligne est relue dans la transaction :
 * partir de l'objet affiché ferait perdre un clic sur deux en saisie rapide,
 * le rendu suivant n'ayant pas encore reçu l'écriture précédente.
 */
export async function setObjectiveAssetLevels(
  assessmentControlId: string,
  cells: { objectiveId: string; groupId: string }[],
  level: DeploymentLevel | null
): Promise<void> {
  await db.transaction("rw", [db.assessmentControls], async () => {
    const current = await db.assessmentControls.get(assessmentControlId);
    if (!current) return;
    const levels: Record<string, Record<string, DeploymentLevel>> = {};
    for (const [objectiveId, byGroup] of Object.entries(current.objectiveAssetLevels ?? {})) {
      levels[objectiveId] = { ...byGroup };
    }
    for (const { objectiveId, groupId } of cells) {
      if (level === null) {
        delete levels[objectiveId]?.[groupId];
        if (levels[objectiveId] && Object.keys(levels[objectiveId]).length === 0) delete levels[objectiveId];
      } else {
        levels[objectiveId] = { ...(levels[objectiveId] ?? {}), [groupId]: level };
      }
    }
    await db.assessmentControls.update(assessmentControlId, {
      objectiveAssetLevels: levels,
      updatedAt: new Date().toISOString(),
    });
  });
}

export interface GroupDeploymentSummary {
  full: number;
  partial: number;
  none: number;
  na: number;
  unset: number;
  total: number;
}

export function groupDeploymentSummary(
  ac: AssessmentControl,
  objectiveIds: string[],
  groupId: string
): GroupDeploymentSummary {
  const summary: GroupDeploymentSummary = { full: 0, partial: 0, none: 0, na: 0, unset: 0, total: objectiveIds.length };
  for (const objectiveId of objectiveIds) {
    const level = ac.objectiveAssetLevels?.[objectiveId]?.[groupId];
    if (level) summary[level]++;
    else summary.unset++;
  }
  return summary;
}

/**
 * Couverture effective par groupe. Dès que la matrice a une saisie pour un
 * groupe, elle fait foi : le groupe est couvert seulement si chaque objectif y
 * est totalement déployé ou non applicable. Sinon on garde la case cochée à la
 * main, pour les évaluations qui n'entrent pas dans ce niveau de détail.
 */
export function effectiveAssetChecks(ac: AssessmentControl, objectiveIds: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = { ...(ac.assetChecks ?? {}) };
  const groupsWithMatrix = new Set<string>();
  for (const objectiveId of objectiveIds) {
    for (const groupId of Object.keys(ac.objectiveAssetLevels?.[objectiveId] ?? {})) groupsWithMatrix.add(groupId);
  }
  for (const groupId of groupsWithMatrix) {
    const s = groupDeploymentSummary(ac, objectiveIds, groupId);
    result[groupId] = s.unset === 0 && s.partial === 0 && s.none === 0;
  }
  return result;
}

export function groupHasMatrixData(ac: AssessmentControl, objectiveIds: string[], groupId: string): boolean {
  return objectiveIds.some((objectiveId) => Boolean(ac.objectiveAssetLevels?.[objectiveId]?.[groupId]));
}
