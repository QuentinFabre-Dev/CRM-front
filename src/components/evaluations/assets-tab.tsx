"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Boxes, ChevronDown, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import {
  createAsset,
  createAssetGroup,
  deleteAsset,
  deleteAssetGroup,
  setAssetGroups,
  setGroupControls,
} from "@/lib/assets";
import { useLang, controlTitle, controlFamilyTitle } from "@/lib/i18n";
import { ASSET_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AssetsTab({ assessmentId }: { assessmentId: string }) {
  const groups = useLiveQuery(() => db.assetGroups.where("assessmentId").equals(assessmentId).toArray(), [assessmentId], []);
  const assets = useLiveQuery(() => db.assets.where("assessmentId").equals(assessmentId).toArray(), [assessmentId], []);
  const members = useLiveQuery(() => db.assetGroupMembers.toArray(), [], []);
  const mappings = useLiveQuery(
    () => db.controlAssetGroups.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState("");
  const [controlPickerGroupId, setControlPickerGroupId] = useState<string | null>(null);

  const assetById = useMemo(() => new Map((assets ?? []).map((a) => [a.id, a])), [assets]);
  const sortedGroups = useMemo(
    () => [...(groups ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [groups]
  );

  const assetsOfGroup = (groupId: string) =>
    (members ?? [])
      .filter((m) => m.groupId === groupId)
      .map((m) => assetById.get(m.assetId))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .sort((a, b) => a.name.localeCompare(b.name));

  const controlCountOfGroup = (groupId: string) => (mappings ?? []).filter((m) => m.groupId === groupId).length;

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    const id = await createAssetGroup(assessmentId, newGroupName);
    setNewGroupName("");
    setExpanded((prev) => new Set(prev).add(id));
  };

  const ungrouped = useMemo(() => {
    const grouped = new Set((members ?? []).map((m) => m.assetId));
    return (assets ?? []).filter((a) => !grouped.has(a.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [assets, members]);

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted-foreground">
        Déclarez les actifs du client, regroupez-les, puis associez chaque groupe aux contrôles qui le concernent.
        Lors de l&apos;évaluation, chaque contrôle affiche la liste des actifs à couvrir.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Nom d'un nouveau groupe (ex. Serveurs de production)"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGroup()}
          className="h-9 w-80"
        />
        <Button size="sm" onClick={addGroup} disabled={!newGroupName.trim()}>
          <Plus size={14} /> Créer le groupe
        </Button>
      </div>

      {sortedGroups.length === 0 && (
        <p className="rounded-md border border-border bg-surface p-4 text-[12.5px] text-muted-foreground">
          Aucun groupe d&apos;actifs. Commencez par en créer un ci-dessus.
        </p>
      )}

      {sortedGroups.map((group) => {
        const groupAssets = assetsOfGroup(group.id);
        const isOpen = expanded.has(group.id);
        return (
          <div key={group.id} className="rounded-md border border-border bg-surface">
            <div className="flex items-center gap-2 p-3">
              <button
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    next.has(group.id) ? next.delete(group.id) : next.add(group.id);
                    return next;
                  })
                }
                className="flex flex-1 items-center gap-2 text-left"
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Boxes size={14} className="text-muted-foreground" />
                <span className="text-[13px] font-medium">{group.name}</span>
                <Badge variant="outline">{groupAssets.length} actif(s)</Badge>
                <Badge variant="outline">{controlCountOfGroup(group.id)} contrôle(s)</Badge>
              </button>
              <Button size="sm" variant="outline" onClick={() => setControlPickerGroupId(group.id)}>
                Contrôles applicables
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Supprimer le groupe"
                onClick={() => deleteAssetGroup(group.id)}
              >
                <Trash2 size={14} className="text-danger" />
              </Button>
            </div>

            {isOpen && (
              <div className="border-t border-border p-3">
                <AssetRows assets={groupAssets} allGroups={sortedGroups} members={members ?? []} />
                <AddAssetForm assessmentId={assessmentId} defaultGroupId={group.id} />
              </div>
            )}
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-3">
          <p className="mb-2 text-[12px] font-medium text-muted-foreground">Actifs sans groupe</p>
          <AssetRows assets={ungrouped} allGroups={sortedGroups} members={members ?? []} />
        </div>
      )}

      {controlPickerGroupId && (
        <ControlPickerDialog
          assessmentId={assessmentId}
          groupId={controlPickerGroupId}
          groupName={sortedGroups.find((g) => g.id === controlPickerGroupId)?.name ?? ""}
          onClose={() => setControlPickerGroupId(null)}
        />
      )}
    </div>
  );
}

function AssetRows({
  assets,
  allGroups,
  members,
}: {
  assets: { id: string; name: string; type: string; description: string }[];
  allGroups: { id: string; name: string }[];
  members: { groupId: string; assetId: string }[];
}) {
  if (assets.length === 0) {
    return <p className="mb-2 text-[12px] text-muted-foreground">Aucun actif dans ce groupe.</p>;
  }
  return (
    <div className="mb-2 space-y-1">
      {assets.map((asset) => {
        const assetGroupIds = members.filter((m) => m.assetId === asset.id).map((m) => m.groupId);
        return (
          <div key={asset.id} className="flex items-center gap-2 rounded-sm bg-surface-2 px-2.5 py-1.5">
            <span className="text-[12px] font-medium">{asset.name}</span>
            {asset.type && <Badge variant="outline">{asset.type}</Badge>}
            {asset.description && (
              <span className="truncate text-[11.5px] text-muted-foreground">{asset.description}</span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <Select
                value={assetGroupIds[0] ?? ""}
                onValueChange={(v) => setAssetGroups(asset.id, v ? [v] : [])}
              >
                <SelectTrigger className="h-7 w-44 text-[11.5px]">
                  <SelectValue placeholder="Groupe…" />
                </SelectTrigger>
                <SelectContent>
                  {allGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" title="Supprimer l'actif" onClick={() => deleteAsset(asset.id)}>
                <Trash2 size={13} className="text-danger" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddAssetForm({ assessmentId, defaultGroupId }: { assessmentId: string; defaultGroupId: string }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(ASSET_TYPES[0]);

  const submit = async () => {
    if (!name.trim()) return;
    await createAsset(assessmentId, { name, type, groupIds: [defaultGroupId] });
    setName("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Nom de l'actif (ex. srv-web-01)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="h-8 w-64"
      />
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="h-8 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ASSET_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={submit} disabled={!name.trim()}>
        <Plus size={13} /> Ajouter l&apos;actif
      </Button>
    </div>
  );
}

function ControlPickerDialog({
  assessmentId,
  groupId,
  groupName,
  onClose,
}: {
  assessmentId: string;
  groupId: string;
  groupName: string;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const assessmentControls = useLiveQuery(
    () => db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);
  const existing = useLiveQuery(() => db.controlAssetGroups.where("groupId").equals(groupId).toArray(), [groupId], []);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [saving, setSaving] = useState(false);

  const controlById = useMemo(() => new Map((controls ?? []).map((c) => [c.id, c])), [controls]);

  // Contrôles du périmètre de l'évaluation uniquement.
  const inScope = useMemo(
    () =>
      (assessmentControls ?? [])
        .map((ac) => controlById.get(ac.controlId))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
    [assessmentControls, controlById]
  );

  const current = selected ?? new Set((existing ?? []).map((m) => m.controlId));

  const families = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of inScope) map.set(c.family, controlFamilyTitle(c, lang));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [inScope, lang]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inScope
      .filter((c) => family === "all" || c.family === family)
      .filter((c) => !needle || `${c.label} ${controlTitle(c, lang)}`.toLowerCase().includes(needle));
  }, [inScope, family, query, lang]);

  const toggle = (id: string) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => current.has(c.id));
  const toggleAllFiltered = () => {
    const next = new Set(current);
    for (const c of filtered) allFilteredSelected ? next.delete(c.id) : next.add(c.id);
    setSelected(next);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await setGroupControls(assessmentId, groupId, [...current]);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Contrôles applicables — {groupName}</DialogTitle>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-8"
              />
            </div>
            <div className="w-56">
              <Select value={family} onValueChange={setFamily}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les familles</SelectItem>
                  {families.map(([id, title]) => (
                    <SelectItem key={id} value={id}>
                      {id.toUpperCase()} — {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={toggleAllFiltered} disabled={filtered.length === 0}>
              {allFilteredSelected ? "Tout décocher" : "Tout cocher"} ({filtered.length})
            </Button>
            <Badge className="ml-auto">{current.size} sélectionné(s)</Badge>
          </div>

          <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
            {filtered.map((c) => (
              <label
                key={c.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 border-b border-border px-3 py-2 last:border-b-0 hover:bg-muted/50",
                  current.has(c.id) && "bg-accent-wash"
                )}
              >
                <input
                  type="checkbox"
                  checked={current.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-border accent-accent"
                />
                <span className="min-w-0">
                  <span className="text-[12px] font-medium">{c.label}</span>
                  <span className="ml-2 text-[11.5px] text-muted-foreground">{controlTitle(c, lang)}</span>
                </span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="p-4 text-[12.5px] text-muted-foreground">Aucun contrôle ne correspond aux filtres.</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={submit} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
