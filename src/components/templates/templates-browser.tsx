"use client";

import { useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, FilePlus2, Pencil, Search, Trash2, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { deleteTemplate, downloadTemplate, importTemplateFile, saveTemplate } from "@/lib/templates";
import { useLang, controlTitle, controlFamilyTitle } from "@/lib/i18n";
import { BASELINES, type Baseline, type ControlTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function TemplatesBrowser() {
  const templates = useLiveQuery(() => db.controlTemplates.orderBy("name").toArray(), [], []);
  const [editing, setEditing] = useState<ControlTemplate | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importTemplateFile(await file.text());
      setMessage(
        `Modèle « ${result.name} » importé : ${result.imported} contrôle(s)` +
          (result.unknownIds.length ? `, ${result.unknownIds.length} id(s) inconnu(s) ignoré(s).` : ".")
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Échec de l'import.");
    } finally {
      e.target.value = "";
    }
  };

  if (editing) {
    return (
      <TemplateEditor
        template={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={(name) => {
          setEditing(null);
          setMessage(`Modèle « ${name} » enregistré.`);
        }}
      />
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setEditing("new")}>
          <FilePlus2 size={14} /> Nouveau modèle
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} /> Importer un modèle
        </Button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImport} />
        <p className="text-[11.5px] text-muted-foreground">
          Un modèle est un sous-ensemble de contrôles réutilisable (ex. « CMA light ») à la création d&apos;une
          évaluation.
        </p>
      </div>

      {message && <p className="text-[12.5px] text-accent">{message}</p>}

      {(templates ?? []).length === 0 ? (
        <p className="rounded-md border border-border bg-surface p-4 text-[12.5px] text-muted-foreground">
          Aucun modèle enregistré pour l&apos;instant.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          {(templates ?? []).map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-border p-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{t.name}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {t.controlIds.length} contrôle(s)
                  {t.description ? ` — ${t.description}` : ""}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(t)} title="Modifier">
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => downloadTemplate(t)} title="Exporter en JSON">
                <Download size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Supprimer"
                onClick={async () => {
                  await deleteTemplate(t.id);
                  setMessage(`Modèle « ${t.name} » supprimé.`);
                }}
              >
                <Trash2 size={14} className="text-danger" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: ControlTemplate | null;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const { lang } = useLang();
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(template?.controlIds ?? []));
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [baseline, setBaseline] = useState<Baseline | "all">("all");
  const [saving, setSaving] = useState(false);

  const families = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of controls ?? []) map.set(c.family, controlFamilyTitle(c, lang));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [controls, lang]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (controls ?? [])
      .filter((c) => family === "all" || c.family === family)
      .filter((c) => baseline === "all" || c.baselines.includes(baseline))
      .filter((c) => !needle || `${c.label} ${controlTitle(c, lang)}`.toLowerCase().includes(needle))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [controls, family, baseline, query, lang]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of filtered) allFilteredSelected ? next.delete(c.id) : next.add(c.id);
      return next;
    });

  const submit = async () => {
    if (!name.trim() || selected.size === 0) return;
    setSaving(true);
    try {
      await saveTemplate({ id: template?.id, name, description, controlIds: [...selected] });
      onSaved(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Nom du modèle</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. CMA light" />
        </div>
        <div>
          <Label>Description (optionnel)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Périmètre réduit pour PME"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un contrôle…"
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
          <div className="w-44">
            <Select value={baseline} onValueChange={(v) => setBaseline(v as Baseline | "all")}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes baselines</SelectItem>
                {BASELINES.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={toggleAllFiltered} disabled={filtered.length === 0}>
            {allFilteredSelected ? "Tout décocher" : "Tout cocher"} ({filtered.length})
          </Button>
          <Badge className="ml-auto">{selected.size} sélectionné(s)</Badge>
        </div>

        <div className="max-h-[52vh] overflow-y-auto">
          {filtered.map((c) => (
            <label
              key={c.id}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 border-b border-border px-3 py-2 transition-colors hover:bg-muted/50",
                selected.has(c.id) && "bg-accent-wash"
              )}
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
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
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={!name.trim() || selected.size === 0 || saving}>
          {saving ? "Enregistrement…" : template ? "Enregistrer les modifications" : "Créer le modèle"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
