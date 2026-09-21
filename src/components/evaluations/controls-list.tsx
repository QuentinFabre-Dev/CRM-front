"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maturityColor } from "@/lib/maturity";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "scored", label: "Évalués" },
  { value: "unscored", label: "Non évalués" },
];

export function ControlsList({
  assessmentId,
  selectedControlId,
  onSelect,
}: {
  assessmentId: string;
  selectedControlId: string | null;
  onSelect: (controlId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [status, setStatus] = useState("all");

  const assessmentControls = useLiveQuery(
    () => db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);
  const controlById = useMemo(() => new Map((controls ?? []).map((c) => [c.id, c])), [controls]);

  const families = useMemo(() => {
    const set = new Map<string, string>();
    for (const c of controls ?? []) set.set(c.family, c.familyTitle);
    return [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [controls]);

  const rows = (assessmentControls ?? [])
    .map((ac) => ({ ac, control: controlById.get(ac.controlId) }))
    .filter((r): r is { ac: (typeof assessmentControls)[number]; control: NonNullable<typeof r.control> } => Boolean(r.control))
    .filter(({ control }) => family === "all" || control.family === family)
    .filter(({ ac }) => status === "all" || (status === "scored" ? ac.maturityScore !== null : ac.maturityScore === null))
    .filter(
      ({ control }) =>
        !query.trim() ||
        `${control.label} ${control.title}`.toLowerCase().includes(query.trim().toLowerCase())
    )
    .sort((a, b) => a.control.id.localeCompare(b.control.id, undefined, { numeric: true }));

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-8" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-muted-foreground">{rows.length} contrôle(s)</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.map(({ ac, control }) => (
          <button
            key={ac.id}
            onClick={() => onSelect(control.id)}
            className={cn(
              "flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors",
              selectedControlId === control.id ? "bg-accent-wash" : "hover:bg-muted"
            )}
          >
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: maturityColor(ac.maturityScore) }}
            />
            <span className="min-w-0">
              <span className="block text-[12.5px] font-medium">{control.label}</span>
              <span className="block truncate text-[11.5px] text-muted-foreground">{control.title}</span>
            </span>
          </button>
        ))}
        {rows.length === 0 && <p className="p-3 text-[12.5px] text-muted-foreground">Aucun contrôle trouvé.</p>}
      </div>
    </div>
  );
}
