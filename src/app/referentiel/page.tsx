"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { BASELINES, sortByCsfFunctionOrder } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatementView } from "@/components/evaluations/statement-view";
import { TemplatesBrowser } from "@/components/templates/templates-browser";
import { cn } from "@/lib/utils";
import { useLang, controlTitle, controlFamilyTitle, controlStatement, controlDiscussion, csfFunctionTitle, csfFunctionText, csfCategoryTitle, csfSubcategoryText } from "@/lib/i18n";

export default function ReferentielPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Référentiel</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Consultation libre du catalogue NIST SP 800-53 Rev 5 et de NIST CSF 2.0, hors contexte d&apos;évaluation.
        </p>
      </div>
      <Tabs defaultValue="controls">
        <TabsList>
          <TabsTrigger value="controls">SP 800-53</TabsTrigger>
          <TabsTrigger value="csf">CSF 2.0</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>
        <TabsContent value="controls">
          <ControlsBrowser />
        </TabsContent>
        <TabsContent value="csf">
          <CsfBrowser />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesBrowser />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ControlsBrowser() {
  const { lang } = useLang();
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const families = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of controls ?? []) map.set(c.family, controlFamilyTitle(c, lang));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [controls, lang]);

  const filtered = (controls ?? [])
    .filter((c) => family === "all" || c.family === family)
    .filter((c) => !query.trim() || `${c.label} ${c.title}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const selected = (controls ?? []).find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="space-y-2 border-b border-border p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 pl-8" />
          </div>
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
          <p className="text-[11px] text-muted-foreground">{filtered.length} contrôle(s)</p>
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left transition-colors",
                selectedId === c.id ? "bg-accent-wash" : "hover:bg-muted"
              )}
            >
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium">{c.label}</span>
                <span className="block truncate text-[11.5px] text-muted-foreground">{controlTitle(c, lang)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto rounded-md border border-border bg-surface p-5">
        {selected ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-medium tracking-tight">
                {selected.label} — {controlTitle(selected, lang)}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {selected.baselines.map((b) => (
                  <Badge key={b}>{BASELINES.find((x) => x.id === b)?.label ?? b}</Badge>
                ))}
                {selected.baselines.length === 0 && <Badge variant="outline">Hors baseline standard</Badge>}
              </div>
            </div>
            <section>
              <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Exigence</h3>
              <StatementView parts={controlStatement(selected, lang)} />
            </section>
            {controlDiscussion(selected, lang) && (
              <section>
                <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Discussion</h3>
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">{controlDiscussion(selected, lang)}</p>
              </section>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">Sélectionnez un contrôle dans la liste.</p>
        )}
      </div>
    </div>
  );
}

function CsfBrowser() {
  const { lang } = useLang();
  const functions = useLiveQuery(() => db.csfFunctions.toArray(), [], []);
  const categories = useLiveQuery(() => db.csfCategories.toArray(), [], []);
  const subcategories = useLiveQuery(() => db.csfSubcategories.toArray(), [], []);
  const mappings = useLiveQuery(() => db.csfMappings.toArray(), [], []);
  const controls = useLiveQuery(() => db.controls.toArray(), [], []);
  const controlById = useMemo(() => new Map((controls ?? []).map((c) => [c.id, c])), [controls]);

  return (
    <div className="mt-3 space-y-3">
      {sortByCsfFunctionOrder(functions ?? []).map((fn) => (
        <div key={fn.id} className="rounded-md border border-border bg-surface p-4">
          <h3 className="text-[13px] font-medium">
            {fn.id} — {csfFunctionTitle(fn, lang)}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{csfFunctionText(fn, lang)}</p>
          <div className="mt-3 space-y-3">
            {(categories ?? [])
              .filter((c) => c.functionId === fn.id)
              .map((cat) => (
                <div key={cat.id}>
                  <p className="text-[12px] font-medium text-muted-foreground">
                    {cat.id} — {csfCategoryTitle(cat, lang)}
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {(subcategories ?? [])
                      .filter((s) => s.categoryId === cat.id)
                      .map((sub) => {
                        const mapped = (mappings ?? []).filter((m) => m.subcategoryId === sub.id);
                        return (
                          <div key={sub.id} className="rounded-sm bg-surface-2 p-2">
                            <p className="text-[11.5px]">
                              <span className="font-medium">{sub.id}</span> — {csfSubcategoryText(sub, lang)}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {mapped.map((m) => (
                                <Badge key={m.controlId} variant="outline">
                                  {controlById.get(m.controlId)?.label ?? m.controlId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
