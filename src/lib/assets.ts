import { db } from "./db";
import { uid, type Asset, type AssetGroup, type AssetGroupMember, type ControlAssetGroup } from "./types";

export async function createAssetGroup(assessmentId: string, name: string, description = ""): Promise<string> {
  const id = uid();
  await db.assetGroups.add({
    id,
    assessmentId,
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function deleteAssetGroup(groupId: string): Promise<void> {
  await db.transaction("rw", [db.assetGroups, db.assetGroupMembers, db.controlAssetGroups], async () => {
    await db.assetGroups.delete(groupId);
    const memberIds = await db.assetGroupMembers.where("groupId").equals(groupId).primaryKeys();
    await db.assetGroupMembers.bulkDelete(memberIds);
    const mappingIds = await db.controlAssetGroups.where("groupId").equals(groupId).primaryKeys();
    await db.controlAssetGroups.bulkDelete(mappingIds);
  });
}

export async function createAsset(
  assessmentId: string,
  input: { name: string; type: string; description?: string; groupIds?: string[] }
): Promise<string> {
  const id = uid();
  await db.transaction("rw", [db.assets, db.assetGroupMembers], async () => {
    await db.assets.add({
      id,
      assessmentId,
      name: input.name.trim(),
      type: input.type,
      description: input.description?.trim() ?? "",
      createdAt: new Date().toISOString(),
    });
    if (input.groupIds?.length) {
      await db.assetGroupMembers.bulkAdd(input.groupIds.map((groupId) => ({ id: uid(), groupId, assetId: id })));
    }
  });
  return id;
}

export async function deleteAsset(assetId: string): Promise<void> {
  await db.transaction("rw", [db.assets, db.assetGroupMembers], async () => {
    await db.assets.delete(assetId);
    const memberIds = await db.assetGroupMembers.where("assetId").equals(assetId).primaryKeys();
    await db.assetGroupMembers.bulkDelete(memberIds);
  });
}

export async function setAssetGroups(assetId: string, groupIds: string[]): Promise<void> {
  await db.transaction("rw", [db.assetGroupMembers], async () => {
    const existingIds = await db.assetGroupMembers.where("assetId").equals(assetId).primaryKeys();
    await db.assetGroupMembers.bulkDelete(existingIds);
    if (groupIds.length) {
      await db.assetGroupMembers.bulkAdd(groupIds.map((groupId) => ({ id: uid(), groupId, assetId })));
    }
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

export async function setAssetCheck(
  assessmentControlId: string,
  current: Record<string, boolean> | undefined,
  assetId: string,
  checked: boolean
): Promise<void> {
  await db.assessmentControls.update(assessmentControlId, {
    assetChecks: { ...(current ?? {}), [assetId]: checked },
    updatedAt: new Date().toISOString(),
  });
}

export interface ApplicableGroup {
  group: AssetGroup;
  assets: Asset[];
}

/**
 * Actifs concernés par un contrôle = union des actifs des groupes associés à ce contrôle.
 * Un contrôle sans groupe associé n'est pas « scopé actifs » : la section reste masquée.
 */
export function applicableGroupsFor(
  controlId: string,
  groups: AssetGroup[],
  assets: Asset[],
  members: AssetGroupMember[],
  mappings: ControlAssetGroup[]
): ApplicableGroup[] {
  const groupIds = mappings.filter((m) => m.controlId === controlId).map((m) => m.groupId);
  if (groupIds.length === 0) return [];

  const assetById = new Map(assets.map((a) => [a.id, a]));
  const groupById = new Map(groups.map((g) => [g.id, g]));

  return groupIds
    .map((groupId) => {
      const group = groupById.get(groupId);
      if (!group) return null;
      const groupAssets = members
        .filter((m) => m.groupId === groupId)
        .map((m) => assetById.get(m.assetId))
        .filter((a): a is Asset => Boolean(a))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { group, assets: groupAssets };
    })
    .filter((g): g is ApplicableGroup => Boolean(g))
    .sort((a, b) => a.group.name.localeCompare(b.group.name));
}

export function coverageFor(
  applicable: ApplicableGroup[],
  assetChecks: Record<string, boolean> | undefined
): { covered: number; total: number } | null {
  const assetIds = new Set(applicable.flatMap((g) => g.assets.map((a) => a.id)));
  if (assetIds.size === 0) return null;
  let covered = 0;
  for (const id of assetIds) if (assetChecks?.[id]) covered++;
  return { covered, total: assetIds.size };
}
