"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Boxes, ChevronDown, ChevronRight, Search } from "lucide-react";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { maturityColor } from "@/lib/maturity";
import { MATURITY_LEVELS, RISK_CRITICALITY_LABELS, type AssessmentControl, type Control, type RiskCriticality } from "@/lib/types";
import { ControlExpandedDetail } from "@/components/evaluations/control-expanded-detail";
import { cn } from "@/lib/utils";
import { useLang, controlTitle, controlFamilyTitle } from "@/lib/i18n";
import { applicableGroups, coverageFor } from "@/lib/assets";

const COLUMNS = "26px 104px minmax(160px,1fr) 108px 152px minmax(180px,320px)";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "scored", label: "Évalués" },
  { value: "unscored", label: "Non évalués" },
];

const CRITICALITY_RANK: Record<RiskCriticality, number> = { high: 3, medium: 2, low: 1 };

// Un contrôle regroupe plusieurs objectifs d'évaluation, chacun avec sa propre
// criticité : on retient la plus élevée pour représenter le contrôle dans ce filtre.
function controlTopCriticality(control: Control): RiskCriticality | null {
  let top: RiskCriticality | null = null;
  for (const obj of control.assessmentObjectives) {
    if (!obj.riskCriticality) continue;
    if (!top || CRITICALITY_RANK[obj.riskCriticality] > CRITICALITY_RANK[top]) top = obj.riskCriticality;
  }
  return top;
}

export function ControlsTable({
  assessmentId,
  focusControlId,
  onFocusHandled,
}: {
  assessmentId: string;
  focusControlId?: string | null;
  onFocusHandled?: () => void;
}) {
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [status, setStatus] = useState("all");
  const [criticality, setCriticality] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const assessmentControls = useLiveQuery(
    () => db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);
  const controlById = useMemo(() => new Map((controls ?? []).map((c) => [c.id, c])), [controls]);

  const assetGroups = useLiveQuery(
    () => db.assetGroups.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const assetMappings = useLiveQuery(
    () => db.controlAssetGroups.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );

  const families = useMemo(() => {
    const map = new Map<string, string>();
    for (const ac of assessmentControls ?? []) {
      const control = controlById.get(ac.controlId);
      if (control) map.set(control.family, control.familyTitle);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [assessmentControls, controlById]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (assessmentControls ?? [])
      .map((ac) => ({ ac, control: controlById.get(ac.controlId) }))
      .filter((r): r is { ac: AssessmentControl; control: Control } => Boolean(r.control))
      .filter(({ control }) => family === "all" || control.family === family)
      .filter(({ ac }) =>
        status === "all" ? true : status === "scored" ? ac.maturityScore !== null : ac.maturityScore === null
      )
      .filter(({ control }) => criticality === "all" || controlTopCriticality(control) === criticality)
      .filter(({ control }) => !needle || `${control.label} ${control.title}`.toLowerCase().includes(needle))
      .sort((a, b) => a.control.id.localeCompare(b.control.id, undefined, { numeric: true }));
  }, [assessmentControls, controlById, family, status, criticality, query]);

  // Arriving from the CSF tab: clear filters, open the row, scroll to it.
  useEffect(() => {
    if (!focusControlId) return;
    setQuery("");
    setFamily("all");
    setStatus("all");
    setCriticality("all");
    setExpanded((prev) => new Set(prev).add(focusControlId));
    const timer = setTimeout(() => {
      rowRefs.current.get(focusControlId)?.scrollIntoView({ block: "start", behavior: "smooth" });
      onFocusHandled?.();
    }, 120);
    return () => clearTimeout(timer);
  }, [focusControlId, onFocusHandled]);

  const toggleRow = (controlId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(controlId)) next.delete(controlId);
      else next.add(controlId);
      return next;
    });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface">
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
        <div className="w-40">
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
        <div className="w-44">
          <Select value={criticality} onValueChange={setCriticality}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les priorités</SelectItem>
              {(Object.keys(RISK_CRITICALITY_LABELS) as RiskCriticality[]).map((level) => (
                <SelectItem key={level} value={level}>
                  {RISK_CRITICALITY_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-[11.5px] text-muted-foreground">{rows.length} contrôle(s)</span>
        {expanded.size > 0 && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setExpanded(new Set())}>
            Tout replier
          </Button>
        )}
      </div>

      <div
        className="grid items-center border-b border-border bg-surface-2 px-2 py-2 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground"
        style={{ gridTemplateColumns: COLUMNS }}
      >
        <span />
        <span>Contrôle</span>
        <span>Intitulé</span>
        <span>Objectifs</span>
        <span>Maturité</span>
        <span>Notes</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.map(({ ac, control }) => (
          <ControlRow
            key={ac.id}
            ac={ac}
            control={control}
            expanded={expanded.has(control.id)}
            onToggle={() => toggleRow(control.id)}
            registerRef={(el) => {
              if (el) rowRefs.current.set(control.id, el);
              else rowRefs.current.delete(control.id);
            }}
            lang={lang}
            coverage={coverageFor(applicableGroups(control.id, assetGroups ?? [], assetMappings ?? []), ac.assetChecks)}
          />
        ))}
        {rows.length === 0 && (
          <p className="p-4 text-[12.5px] text-muted-foreground">Aucun contrôle ne correspond aux filtres.</p>
        )}
      </div>
    </div>
  );
}

function ControlRow({
  ac,
  control,
  expanded,
  onToggle,
  registerRef,
  lang,
  coverage,
}: {
  ac: AssessmentControl;
  control: Control;
  expanded: boolean;
  onToggle: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  lang: "fr" | "en";
  coverage: { covered: number; total: number } | null;
}) {
  const checkedCount = Object.values(ac.objectiveChecks).filter(Boolean).length;
  const totalObjectives = control.assessmentObjectives.length;

  const setMaturity = (score: number) =>
    db.assessmentControls.update(ac.id, {
      maturityScore: ac.maturityScore === score ? null : score,
      updatedAt: new Date().toISOString(),
    });

  return (
    <div
      ref={registerRef}
      data-control-id={control.id}
      className={cn("border-b border-border", expanded && "bg-surface-2/50")}
    >
      <div
        className="group grid items-center px-2 transition-colors hover:bg-muted/50"
        style={{ gridTemplateColumns: COLUMNS }}
      >
        <button onClick={onToggle} className="flex h-9 items-center justify-center text-muted-foreground">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button onClick={onToggle} className="flex h-9 items-center gap-2 text-left">
          <span
            className="h-3.5 w-[3px] shrink-0 rounded-full"
            style={{ backgroundColor: maturityColor(ac.maturityScore) }}
          />
          <span className="text-[12px] font-medium">{control.label}</span>
        </button>
        <button onClick={onToggle} className="h-9 truncate pr-3 text-left text-[12px] text-muted-foreground">
          {controlTitle(control, lang)}
        </button>
        <span className="flex items-center gap-1.5 text-[11.5px] tabular-nums text-muted-foreground">
          <span>{totalObjectives > 0 ? `${checkedCount}/${totalObjectives}` : "—"}</span>
          {coverage && (
            <span
              title={`Couverture actifs : ${coverage.covered}/${coverage.total} catégorie(s)`}
              className={cn(
                "flex items-center gap-0.5 rounded-sm px-1 py-px text-[10.5px]",
                coverage.covered === coverage.total ? "bg-muted" : "bg-warning/15 text-warning"
              )}
            >
              <Boxes size={10} />
              {coverage.covered}/{coverage.total}
            </span>
          )}
        </span>
        <MaturityCells value={ac.maturityScore} onChange={setMaturity} />
        <NotesCell ac={ac} />
      </div>
      {expanded && (
        <div className="border-t border-border bg-surface px-4 py-4">
          <ControlExpandedDetail control={control} ac={ac} />
        </div>
      )}
    </div>
  );
}

function MaturityCells({ value, onChange }: { value: number | null; onChange: (score: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {MATURITY_LEVELS.map((level) => {
        const active = value === level.score;
        const color = maturityColor(level.score);
        return (
          <button
            key={level.score}
            onClick={() => onChange(level.score)}
            title={`${level.score} — ${level.label} : ${level.description}`}
            aria-label={`Maturité ${level.score} — ${level.label}`}
            className={cn(
              "flex h-[22px] w-[22px] items-center justify-center rounded-sm border text-[10.5px] font-medium transition-colors",
              active ? "border-transparent text-white" : "border-border text-muted-foreground hover:bg-muted"
            )}
            style={active ? { backgroundColor: color } : undefined}
          >
            {level.score}
          </button>
        );
      })}
    </div>
  );
}

function NotesCell({ ac }: { ac: AssessmentControl }) {
  const [value, setValue] = useState(ac.notes);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setValue(ac.notes);
    // Re-sync only when the row changes, not while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ac.id]);

  const commit = () => {
    setFocused(false);
    if (value === ac.notes) return;
    db.assessmentControls.update(ac.id, { notes: value, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="relative mr-2 h-7">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.blur();
        }}
        placeholder="Ajouter une note…"
        className={cn(
          "w-full resize-none rounded-sm border bg-transparent px-2 py-1 text-[12px] leading-5 outline-none transition placeholder:text-muted-foreground/50",
          focused
            ? "absolute right-0 top-0 z-20 h-24 border-accent bg-surface shadow-popover ring-2 ring-accent/20"
            : "h-7 overflow-hidden border-transparent group-hover:border-border"
        )}
      />
    </div>
  );
}
