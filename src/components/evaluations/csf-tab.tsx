"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { maturityColor, maturityLabel, average } from "@/lib/maturity";
import { cn } from "@/lib/utils";

export function CsfTab({
  assessmentId,
  onJumpToControl,
}: {
  assessmentId: string;
  onJumpToControl?: (controlId: string) => void;
}) {
  const functions = useLiveQuery(() => db.csfFunctions.toArray(), [], []);
  const categories = useLiveQuery(() => db.csfCategories.toArray(), [], []);
  const subcategories = useLiveQuery(() => db.csfSubcategories.toArray(), [], []);
  const mappings = useLiveQuery(() => db.csfMappings.toArray(), [], []);
  const assessmentControls = useLiveQuery(
    () => db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    [assessmentId],
    []
  );
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const scoreByControlId = useMemo(
    () => new Map((assessmentControls ?? []).map((ac) => [ac.controlId, ac.maturityScore])),
    [assessmentControls]
  );
  const controlById = useMemo(() => new Map((controls ?? []).map((c) => [c.id, c])), [controls]);

  const subcategoryScores = useMemo(() => {
    const byId = new Map<string, number[]>();
    for (const m of mappings ?? []) {
      if (!scoreByControlId.has(m.controlId)) continue;
      const score = scoreByControlId.get(m.controlId);
      if (score === null || score === undefined) continue;
      if (!byId.has(m.subcategoryId)) byId.set(m.subcategoryId, []);
      byId.get(m.subcategoryId)!.push(score);
    }
    const avgById = new Map<string, number | null>();
    for (const sub of subcategories ?? []) {
      avgById.set(sub.id, average(byId.get(sub.id) ?? []));
    }
    return avgById;
  }, [mappings, scoreByControlId, subcategories]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted-foreground">
        Maturité moyenne des contrôles NIST SP 800-53 en périmètre, agrégée par fonction, catégorie et
        sous-catégorie NIST CSF 2.0 (crosswalk officiel NIST OLIR).
      </p>
      {(functions ?? []).map((fn) => {
        const fnCategories = (categories ?? []).filter((c) => c.functionId === fn.id);
        const fnScores = fnCategories.flatMap((cat) =>
          (subcategories ?? [])
            .filter((s) => s.categoryId === cat.id)
            .map((s) => subcategoryScores.get(s.id) ?? null)
        );
        const fnAvg = average(fnScores);
        return (
          <div key={fn.id} className="rounded-md border border-border bg-surface">
            <button
              onClick={() => toggle(fn.id)}
              className="flex w-full items-center justify-between gap-3 p-3 text-left"
            >
              <span className="flex items-center gap-2">
                {expanded.has(fn.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-[13px] font-medium">
                  {fn.id} — {fn.title}
                </span>
              </span>
              <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: maturityColor(fnAvg) }} />
                {fnAvg !== null ? `${fnAvg}/5` : "N/A"}
              </span>
            </button>
            {expanded.has(fn.id) && (
              <div className="space-y-1.5 border-t border-border p-3 pt-2">
                {fnCategories.map((cat) => {
                  const catSubs = (subcategories ?? []).filter((s) => s.categoryId === cat.id);
                  const catAvg = average(catSubs.map((s) => subcategoryScores.get(s.id) ?? null));
                  const catKey = `cat-${cat.id}`;
                  return (
                    <div key={cat.id} className="rounded-sm border border-border">
                      <button
                        onClick={() => toggle(catKey)}
                        className="flex w-full items-center justify-between gap-3 p-2.5 text-left"
                      >
                        <span className="flex items-center gap-2">
                          {expanded.has(catKey) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          <span className="text-[12.5px] font-medium">
                            {cat.id} — {cat.title}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: maturityColor(catAvg) }} />
                          {catAvg !== null ? `${catAvg}/5` : "N/A"}
                        </span>
                      </button>
                      {expanded.has(catKey) && (
                        <div className="space-y-1 border-t border-border p-2.5 pt-1.5">
                          {catSubs.map((sub) => {
                            const subAvg = subcategoryScores.get(sub.id) ?? null;
                            const subControls = (mappings ?? []).filter((m) => m.subcategoryId === sub.id);
                            return (
                              <div key={sub.id} className="rounded-sm bg-surface-2 p-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[11.5px] font-medium">
                                    {sub.id} <span className="font-normal text-muted-foreground">— {sub.text}</span>
                                  </p>
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                                    )}
                                    style={{ backgroundColor: maturityColor(subAvg) }}
                                  >
                                    {subAvg !== null ? subAvg : "—"}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {subControls.map((m) => {
                                    const control = controlById.get(m.controlId);
                                    const score = scoreByControlId.get(m.controlId);
                                    if (!control) return null;
                                    const inScope = scoreByControlId.has(m.controlId);
                                    return (
                                      <button
                                        key={m.controlId}
                                        disabled={!inScope}
                                        onClick={() => onJumpToControl?.(m.controlId)}
                                        title={inScope ? maturityLabel(score ?? null) : "Hors périmètre de cette baseline"}
                                        className={cn(
                                          "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                                          inScope ? "border-transparent text-white" : "border-border text-muted-foreground opacity-50"
                                        )}
                                        style={inScope ? { backgroundColor: maturityColor(score ?? null) } : undefined}
                                      >
                                        {control.label}
                                      </button>
                                    );
                                  })}
                                  {subControls.length === 0 && (
                                    <span className="text-[10.5px] text-muted-foreground">Aucun contrôle mappé.</span>
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
            )}
          </div>
        );
      })}
    </div>
  );
}
