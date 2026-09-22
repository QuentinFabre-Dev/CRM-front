"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { maturityColor, maturityLabel, average } from "@/lib/maturity";
import { cn } from "@/lib/utils";
import { useLang, cisControlTitle, cisSafeguardTitle, cisSafeguardDescription } from "@/lib/i18n";
import { CIS_IMPLEMENTATION_GROUPS, type CisImplementationGroup } from "@/lib/types";

export function CisTab({
  assessmentId,
  onJumpToControl,
}: {
  assessmentId: string;
  onJumpToControl?: (controlId: string) => void;
}) {
  const { lang } = useLang();
  const cisControls = useLiveQuery(() => db.cisControls.toArray(), [], []);
  const safeguards = useLiveQuery(() => db.cisSafeguards.toArray(), [], []);
  const mappings = useLiveQuery(() => db.cisMappings.toArray(), [], []);
  const assessmentControls = useLiveQuery(
    () => db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [igFilter, setIgFilter] = useState<CisImplementationGroup | null>(null);

  const scoreByControlId = useMemo(
    () => new Map((assessmentControls ?? []).map((ac) => [ac.controlId, ac.maturityScore])),
    [assessmentControls]
  );
  const controlById = useMemo(() => new Map((controls ?? []).map((c) => [c.id, c])), [controls]);

  const mappedControlIds = useMemo(() => {
    const bySafeguard = new Map<string, string[]>();
    for (const m of mappings ?? []) {
      if (!bySafeguard.has(m.safeguardId)) bySafeguard.set(m.safeguardId, []);
      bySafeguard.get(m.safeguardId)!.push(m.controlId);
    }
    return bySafeguard;
  }, [mappings]);

  const safeguardScore = useMemo(() => {
    const byId = new Map<string, number | null>();
    for (const sg of safeguards ?? []) {
      const scores = (mappedControlIds.get(sg.id) ?? [])
        .filter((id) => scoreByControlId.has(id))
        .map((id) => scoreByControlId.get(id) ?? null);
      byId.set(sg.id, average(scores));
    }
    return byId;
  }, [safeguards, mappedControlIds, scoreByControlId]);

  // Les paliers CIS sont cumulatifs : filtrer sur IG2 retient l'IG1 et l'IG2.
  const visibleSafeguards = useMemo(
    () => (safeguards ?? []).filter((sg) => igFilter === null || sg.ig <= igFilter),
    [safeguards, igFilter]
  );

  const safeguardsByControl = useMemo(() => {
    const byControl = new Map<number, typeof visibleSafeguards>();
    for (const sg of visibleSafeguards) {
      if (!byControl.has(sg.controlNumber)) byControl.set(sg.controlNumber, []);
      byControl.get(sg.controlNumber)!.push(sg);
    }
    for (const list of byControl.values()) {
      list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }
    return byControl;
  }, [visibleSafeguards]);

  const toggle = (n: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const mappedCount = visibleSafeguards.filter((sg) => (mappedControlIds.get(sg.id) ?? []).length > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-[60ch] text-[12.5px] text-muted-foreground">
          Maturité moyenne des contrôles NIST SP 800-53 en périmètre, agrégée par safeguard et contrôle
          CIS Controls v8.1 (crosswalk officiel publié par le CIS).
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 text-[11.5px] text-muted-foreground">Palier</span>
          <button
            onClick={() => setIgFilter(null)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
              igFilter === null ? "border-transparent bg-accent text-white" : "border-border text-muted-foreground"
            )}
          >
            Tous
          </button>
          {CIS_IMPLEMENTATION_GROUPS.map((ig) => (
            <button
              key={ig.id}
              onClick={() => setIgFilter(ig.id)}
              title={ig.description}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                igFilter === ig.id ? "border-transparent bg-accent text-white" : "border-border text-muted-foreground"
              )}
            >
              {ig.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11.5px] text-muted-foreground">
        {visibleSafeguards.length} safeguards affichés · {mappedCount} rattachés à au moins un contrôle 800-53
        {igFilter !== null && " · les paliers CIS sont cumulatifs (IG2 inclut IG1)"}
      </p>

      {(cisControls ?? []).map((ctrl) => {
        const ctrlSafeguards = safeguardsByControl.get(ctrl.number) ?? [];
        if (ctrlSafeguards.length === 0) return null;
        const ctrlAvg = average(ctrlSafeguards.map((sg) => safeguardScore.get(sg.id) ?? null));
        return (
          <div key={ctrl.number} className="rounded-md border border-border bg-surface">
            <button
              onClick={() => toggle(ctrl.number)}
              className="flex w-full items-center justify-between gap-3 p-3 text-left"
            >
              <span className="flex items-center gap-2">
                {expanded.has(ctrl.number) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-[13px] font-medium">
                  {ctrl.number}. {cisControlTitle(ctrl, lang)}
                </span>
                <span className="text-[11px] text-muted-foreground">({ctrlSafeguards.length})</span>
              </span>
              <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: maturityColor(ctrlAvg) }} />
                {ctrlAvg !== null ? `${ctrlAvg}/5` : "N/A"}
              </span>
            </button>

            {expanded.has(ctrl.number) && (
              <div className="space-y-1 border-t border-border p-3 pt-2">
                {ctrlSafeguards.map((sg) => {
                  const score = safeguardScore.get(sg.id) ?? null;
                  const sgControls = mappedControlIds.get(sg.id) ?? [];
                  return (
                    <div key={sg.id} className="rounded-sm bg-surface-2 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11.5px] font-medium">
                            {sg.id} — {cisSafeguardTitle(sg, lang)}
                          </p>
                          <p
                            title={cisSafeguardDescription(sg, lang)}
                            className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground"
                          >
                            {cisSafeguardDescription(sg, lang)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            IG{sg.ig}
                          </span>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: maturityColor(score) }}
                          >
                            {score !== null ? score : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {sgControls.map((controlId) => {
                          const control = controlById.get(controlId);
                          if (!control) return null;
                          const inScope = scoreByControlId.has(controlId);
                          const controlScore = scoreByControlId.get(controlId);
                          return (
                            <button
                              key={controlId}
                              disabled={!inScope}
                              onClick={() => onJumpToControl?.(controlId)}
                              title={inScope ? maturityLabel(controlScore ?? null) : "Hors périmètre de cette baseline"}
                              className={cn(
                                "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                                inScope
                                  ? "border-transparent text-white"
                                  : "border-border text-muted-foreground opacity-50"
                              )}
                              style={inScope ? { backgroundColor: maturityColor(controlScore ?? null) } : undefined}
                            >
                              {control.label}
                            </button>
                          );
                        })}
                        {sgControls.length === 0 && (
                          <span className="text-[10.5px] text-muted-foreground">
                            Aucun contrôle 800-53 mappé par le CIS.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
