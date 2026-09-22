"use client";

import { Check, Contrast, Plus, X } from "lucide-react";
import { STATUS } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";
import {
  groupDeploymentSummary,
  setControlGroupApplicable,
  setObjectiveAssetLevels,
} from "@/lib/assets";
import { CriticalityIndicator } from "@/components/ui/criticality-indicator";
import {
  DEPLOYMENT_LEVELS,
  type AssessmentControl,
  type AssessmentObjective,
  type AssetGroup,
  type DeploymentLevel,
} from "@/lib/types";
import { db } from "@/lib/db";

// Les niveaux reprennent la palette d'état (critique / avertissement / bon) :
// c'est bien un état, et chaque bouton porte aussi une icône et un libellé,
// jamais la couleur seule.
const LEVEL_STYLE: Record<DeploymentLevel, { bg: string; fg: string }> = {
  none: { bg: STATUS.critical, fg: "#ffffff" },
  partial: { bg: STATUS.warning, fg: "#2b2a26" },
  full: { bg: STATUS.good, fg: "#ffffff" },
  na: { bg: "#8c8a82", fg: "#ffffff" },
};

function LevelGlyph({ level, size = 12 }: { level: DeploymentLevel; size?: number }) {
  if (level === "none") return <X size={size} strokeWidth={2.6} />;
  if (level === "partial") return <Contrast size={size} strokeWidth={2.4} />;
  if (level === "full") return <Check size={size} strokeWidth={2.8} />;
  return <span className="text-[8.5px] font-semibold leading-none">N/A</span>;
}

function levelLabel(level: DeploymentLevel): string {
  return DEPLOYMENT_LEVELS.find((l) => l.id === level)?.label ?? level;
}

function DeploymentCell({
  value,
  onChange,
  context,
}: {
  value: DeploymentLevel | undefined;
  onChange: (level: DeploymentLevel | null) => void;
  context: string;
}) {
  return (
    <div role="radiogroup" aria-label={context} className="flex items-center justify-center gap-0.5">
      {DEPLOYMENT_LEVELS.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={active ? `${label} — cliquer pour effacer` : label}
            onClick={() => onChange(active ? null : id)}
            className={cn(
              "flex h-[22px] w-[22px] items-center justify-center rounded-sm border transition-colors",
              active ? "border-transparent" : "border-border text-muted-foreground/55 hover:bg-muted hover:text-foreground"
            )}
            style={active ? { backgroundColor: LEVEL_STYLE[id].bg, color: LEVEL_STYLE[id].fg } : undefined}
          >
            <LevelGlyph level={id} />
          </button>
        );
      })}
    </div>
  );
}

export function DeploymentLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {DEPLOYMENT_LEVELS.map(({ id, label }) => (
        <span key={id} className="inline-flex items-center gap-1.5">
          <span
            className="flex h-[18px] w-[18px] items-center justify-center rounded-sm"
            style={{ backgroundColor: LEVEL_STYLE[id].bg, color: LEVEL_STYLE[id].fg }}
          >
            <LevelGlyph level={id} size={11} />
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}

function ColumnSummary({ ac, objectiveIds, groupId }: { ac: AssessmentControl; objectiveIds: string[]; groupId: string }) {
  const s = groupDeploymentSummary(ac, objectiveIds, groupId);
  const assessed = s.total - s.unset;
  let verdict: { text: string; className: string };
  if (assessed === 0) verdict = { text: "Non évalué", className: "text-muted-foreground" };
  else if (s.unset > 0) verdict = { text: `${s.unset} à évaluer`, className: "text-muted-foreground" };
  else if (s.none === 0 && s.partial === 0) verdict = { text: "Couvert", className: "text-success" };
  else verdict = { text: "Non couvert", className: "text-danger" };

  return (
    <div className="space-y-0.5 text-center text-[10.5px] tabular-nums">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <span className="inline-flex items-center gap-0.5" title="Totalement déployé">
          <LevelGlyph level="full" size={10} /> {s.full}
        </span>
        <span className="inline-flex items-center gap-0.5" title="Partiellement déployé">
          <LevelGlyph level="partial" size={10} /> {s.partial}
        </span>
        <span className="inline-flex items-center gap-0.5" title="Pas en place">
          <LevelGlyph level="none" size={10} /> {s.none}
        </span>
      </div>
      <div className={cn("font-medium", verdict.className)}>{verdict.text}</div>
    </div>
  );
}

export function DeploymentMatrix({
  ac,
  objectives,
  applicable,
  otherGroups,
}: {
  ac: AssessmentControl;
  objectives: AssessmentObjective[];
  applicable: AssetGroup[];
  otherGroups: AssetGroup[];
}) {
  const objectiveIds = objectives.map((o) => o.id);

  const toggleObjective = (objectiveId: string) =>
    db.assessmentControls
      .where("id")
      .equals(ac.id)
      .modify((row) => {
        row.objectiveChecks = { ...row.objectiveChecks, [objectiveId]: !row.objectiveChecks[objectiveId] };
        row.updatedAt = new Date().toISOString();
      });

  const fillEmpty = (groupId: string, level: DeploymentLevel) => {
    const cells = objectiveIds
      .filter((objectiveId) => !ac.objectiveAssetLevels?.[objectiveId]?.[groupId])
      .map((objectiveId) => ({ objectiveId, groupId }));
    if (cells.length) setObjectiveAssetLevels(ac.id, cells, level);
  };

  const addGroup = (groupId: string) => setControlGroupApplicable(ac.assessmentId, ac.controlId, groupId, true);
  const removeGroup = (group: AssetGroup) => {
    // La saisie éventuelle est conservée : la réintégrer restitue la colonne telle quelle.
    setControlGroupApplicable(ac.assessmentId, ac.controlId, group.id, false);
  };

  const addSelect = otherGroups.length > 0 && (
    <label className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:text-foreground">
      <Plus size={12} />
      <select
        aria-label="Ajouter une catégorie d'actifs à ce contrôle"
        value=""
        onChange={(e) => e.target.value && addGroup(e.target.value)}
        className="cursor-pointer bg-transparent outline-none"
      >
        <option value="">Ajouter une catégorie d&apos;actifs</option>
        {otherGroups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </label>
  );

  if (applicable.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-5 text-center">
        <p className="text-[13px] text-muted-foreground">
          Aucune catégorie d&apos;actifs n&apos;est rattachée à ce contrôle.
          {otherGroups.length > 0 ? " Ajoutez celles qui le concernent." : ""}
        </p>
        {addSelect && <div className="mt-3">{addSelect}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DeploymentLegend />
        {addSelect}
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-md border border-border bg-surface">
        <table className="border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[360px] max-w-[440px] border-b border-r border-border bg-surface-2 px-3 py-2 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                Objectif d&apos;évaluation (800-53A)
              </th>
              {applicable.map((group) => (
                <th
                  key={group.id}
                  className="sticky top-0 z-20 w-[136px] min-w-[136px] border-b border-r border-border bg-surface-2 px-2 py-2 align-top last:border-r-0"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="line-clamp-2 text-[11.5px] font-medium leading-tight" title={group.description || group.name}>
                      {group.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeGroup(group)}
                      aria-label={`Retirer ${group.name} de ce contrôle`}
                      title="Non applicable à ce contrôle — retirer la colonne"
                      className="shrink-0 rounded-sm p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                    >
                      <X size={11} />
                    </button>
                  </div>
                  <select
                    aria-label={`Compléter les cases vides de ${group.name}`}
                    title="Applique le niveau choisi aux seules cases encore vides de la colonne"
                    value=""
                    onChange={(e) => e.target.value && fillEmpty(group.id, e.target.value as DeploymentLevel)}
                    className="mt-1.5 w-full cursor-pointer rounded-sm border border-border bg-surface px-1 py-0.5 text-[10.5px] font-normal text-muted-foreground outline-none"
                  >
                    <option value="">Remplir les vides</option>
                    {DEPLOYMENT_LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objectives.map((obj) => (
              <tr key={obj.id} className="group">
                <th
                  scope="row"
                  className="sticky left-0 z-10 min-w-[360px] max-w-[440px] border-b border-r border-border bg-surface px-3 py-2 align-top font-normal group-hover:bg-surface-2"
                >
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(ac.objectiveChecks[obj.id])}
                      onChange={() => toggleObjective(obj.id)}
                      aria-label={`Objectif ${obj.label} vérifié`}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-border accent-accent"
                    />
                    <CriticalityIndicator level={obj.riskCriticality} />
                    <span className="text-[12px] leading-snug">
                      <span className="mr-1 font-medium text-muted-foreground">{obj.label}</span>
                      {obj.text}
                    </span>
                  </label>
                </th>
                {applicable.map((group) => {
                  const value = ac.objectiveAssetLevels?.[obj.id]?.[group.id];
                  return (
                    <td
                      key={group.id}
                      className="border-b border-r border-border px-1.5 py-2 align-top last:border-r-0 group-hover:bg-surface-2/60"
                    >
                      <DeploymentCell
                        value={value}
                        context={`${obj.label} — ${group.name}${value ? ` : ${levelLabel(value)}` : ""}`}
                        onChange={(level) => setObjectiveAssetLevels(ac.id, [{ objectiveId: obj.id, groupId: group.id }], level)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky bottom-0 left-0 z-30 border-r border-t border-border bg-surface-2 px-3 py-2 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                Synthèse par catégorie
              </th>
              {applicable.map((group) => (
                <td key={group.id} className="sticky bottom-0 z-20 border-r border-t border-border bg-surface-2 px-1.5 py-2 last:border-r-0">
                  <ColumnSummary ac={ac} objectiveIds={objectiveIds} groupId={group.id} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Une catégorie est couverte quand chaque objectif y est totalement déployé ou non applicable. Cette couverture
        remplace la case « couvert » cochée à la main dans l&apos;onglet Contrôles dès qu&apos;une colonne est renseignée.
      </p>
    </div>
  );
}
