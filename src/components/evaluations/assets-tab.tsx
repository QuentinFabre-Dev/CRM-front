"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Boxes, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { applyDefaultMapping, createAssetGroup, deleteAssetGroup, setGroupControls } from "@/lib/assets";
import { useLang, controlTitle, controlFamilyTitle } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AssetsTab({ assessmentId }: { assessmentId: string }) {
  const groups = useLiveQuery(
    () => db.assetGroups.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const mappings = useLiveQuery(
    () => db.controlAssetGroups.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );

  const [newGroupName, setNewGroupName] = useState("");
  const [pickerGroupId, setPickerGroupId] = useState<string | null>(null);
  const [confirmRemap, setConfirmRemap] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const sortedGroups = useMemo(() => [...(groups ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [groups]);
  const controlCountOf = (groupId: string) => (mappings ?? []).filter((m) => m.groupId === groupId).length;
  const hasMapping = (mappings ?? []).length > 0;

  const runDefaultMapping = async () => {
    setApplying(true);
    try {
      const result = await applyDefaultMapping(assessmentId);
      setMessage(
        `Mapping proposé appliqué : ${result.groupsCreated} catégorie(s) créée(s), ${result.controlsMapped} contrôle(s) rattaché(s) à au moins une catégorie.`
      );
    } finally {
      setApplying(false);
      setConfirmRemap(false);
    }
  };

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    await createAssetGroup(assessmentId, newGroupName);
    setNewGroupName("");
  };

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted-foreground">
        Le périmètre se raisonne par catégorie d&apos;actifs (serveur physique, VM, instance infonuagique…), pas par
        machine. Chaque contrôle affiche ensuite les catégories sur lesquelles il doit être couvert.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {hasMapping && !confirmRemap ? (
          <Button size="sm" variant="outline" onClick={() => setConfirmRemap(true)}>
            <Sparkles size={14} /> Réappliquer le mapping proposé
          </Button>
        ) : confirmRemap ? (
          <>
            <Button size="sm" variant="danger" onClick={runDefaultMapping} disabled={applying}>
              {applying ? "Application…" : "Confirmer : remplacer le mapping actuel"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmRemap(false)}>
              Annuler
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={runDefaultMapping} disabled={applying}>
            <Sparkles size={14} /> {applying ? "Application…" : "Proposer un mapping"}
          </Button>
        )}

        <span className="mx-1 h-5 w-px bg-border" />

        <Input
          placeholder="Ajouter une catégorie sur mesure"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGroup()}
          className="h-8 w-64"
        />
        <Button size="sm" variant="outline" onClick={addGroup} disabled={!newGroupName.trim()}>
          <Plus size={13} /> Ajouter
        </Button>
      </div>

      {message && <p className="text-[12.5px] text-accent">{message}</p>}

      {sortedGroups.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-[12.5px] text-muted-foreground">
            Aucune catégorie d&apos;actifs. « Proposer un mapping » crée le catalogue standard (serveur physique,
            VM, instance infonuagique, SaaS, conteneur, poste, mobile, réseau, base de données, application,
            annuaire/IAM, stockage, site, OT/IoT) et rattache chaque contrôle aux catégories pertinentes selon sa
            famille SP 800-53. Tout reste modifiable ensuite.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_auto] items-center gap-3 border-b border-border bg-surface-2 px-3 py-2 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Catégorie d&apos;actifs</span>
            <span>Contrôles</span>
            <span />
          </div>
          {sortedGroups.map((group) => (
            <div
              key={group.id}
              className="grid grid-cols-[minmax(0,1fr)_120px_auto] items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[12.5px] font-medium">
                  <Boxes size={13} className="shrink-0 text-muted-foreground" />
                  {group.name}
                </p>
                {group.description && (
                  <p className="mt-0.5 truncate pl-[21px] text-[11.5px] text-muted-foreground">{group.description}</p>
                )}
              </div>
              <Badge variant="outline" className="justify-self-start">
                {controlCountOf(group.id)}
              </Badge>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setPickerGroupId(group.id)}>
                  Contrôles applicables
                </Button>
                <Button size="sm" variant="ghost" title="Supprimer" onClick={() => deleteAssetGroup(group.id)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pickerGroupId && (
        <ControlPickerDialog
          assessmentId={assessmentId}
          groupId={pickerGroupId}
          groupName={sortedGroups.find((g) => g.id === pickerGroupId)?.name ?? ""}
          onClose={() => setPickerGroupId(null)}
        />
      )}
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
