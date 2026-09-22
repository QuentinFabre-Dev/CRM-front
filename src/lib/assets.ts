import { db } from "./db";
import { DEFAULT_ASSET_GROUPS, defaultGroupKeysForFamily } from "./asset-mapping";
import { uid, type AssetGroup, type ControlAssetGroup } from "./types";

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
