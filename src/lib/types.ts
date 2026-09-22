export type Baseline = "low" | "moderate" | "high" | "privacy";

/**
 * Ordre canonique des fonctions NIST CSF 2.0. IndexedDB (via Dexie) retourne
 * les fonctions par ordre de clé primaire, donc alphabétique (DE, GV, ID,
 * PR, RC, RS) — jamais l'ordre du framework. On retrie systématiquement à
 * l'affichage avec cette liste plutôt que de se fier à l'ordre de requête.
 */
export const CSF_FUNCTION_ORDER = ["GV", "ID", "PR", "DE", "RS", "RC"] as const;

export function sortByCsfFunctionOrder<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => CSF_FUNCTION_ORDER.indexOf(a.id as (typeof CSF_FUNCTION_ORDER)[number]) -
      CSF_FUNCTION_ORDER.indexOf(b.id as (typeof CSF_FUNCTION_ORDER)[number])
  );
}

export const BASELINES: { id: Baseline; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "moderate", label: "Moderate" },
  { id: "high", label: "High" },
  { id: "privacy", label: "Privacy" },
];

export interface StatementPart {
  label: string;
  prose: string;
  parts?: StatementPart[];
}

export interface AssessmentObjective {
  id: string;
  label: string;
  text: string;
}

export interface AssessmentMethod {
  method: string;
  objects: string;
}

export interface Control {
  id: string;
  baseId: string | null;
  isEnhancement: boolean;
  family: string;
  familyTitle: string;
  familyTitleFr?: string;
  label: string;
  title: string;
  titleFr?: string;
  statement: StatementPart[];
  statementFr?: StatementPart[];
  discussion: string;
  discussionFr?: string;
  assessmentObjectives: AssessmentObjective[];
  assessmentObjectivesFr?: (AssessmentObjective & { textFr: string })[];
  assessmentMethods: AssessmentMethod[];
  assessmentMethodsFr?: (AssessmentMethod & { objectsFr: string })[];
  baselines: Baseline[];
}

export interface CsfFunction {
  id: string;
  title: string;
  titleFr?: string;
  text: string;
  textFr?: string;
}

export interface CsfCategory {
  id: string;
  functionId: string;
  title: string;
  titleFr?: string;
  text: string;
  textFr?: string;
}

export interface CsfSubcategory {
  id: string;
  categoryId: string;
  functionId: string;
  text: string;
  textFr?: string;
  /** Implementation Examples officiels NIST : actions concrètes illustrant la sous-catégorie. */
  examples?: string[];
  examplesFr?: string[];
}

export interface CsfMapping {
  id?: number;
  subcategoryId: string;
  controlId: string;
}

export type AssessmentStatus = "in-progress" | "complete";

export interface Assessment {
  id: string;
  clientName: string;
  baseline: Baseline;
  assessor: string;
  createdAt: string;
  status: AssessmentStatus;
  /** Renseigné quand le périmètre vient d'un modèle personnalisé plutôt que d'une baseline NIST. */
  templateId?: string;
  /** Nom figé à la création : l'évaluation reste lisible même si le modèle est renommé ou supprimé. */
  templateName?: string;
}

export interface ControlTemplate {
  id: string;
  name: string;
  description: string;
  controlIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const MATURITY_LEVELS = [
  { score: 0, label: "Inexistant", description: "Aucun processus en place." },
  { score: 1, label: "Initial", description: "Ad hoc, non documenté, dépend des individus." },
  { score: 2, label: "Reproductible", description: "Informel mais répété, peu documenté." },
  { score: 3, label: "Défini", description: "Documenté, standardisé, communiqué." },
  { score: 4, label: "Géré", description: "Mesuré, piloté avec des indicateurs." },
  { score: 5, label: "Optimisé", description: "Amélioration continue, bonnes pratiques." },
] as const;

export interface AssessmentControl {
  id: string;
  assessmentId: string;
  controlId: string;
  maturityScore: number | null;
  objectiveChecks: Record<string, boolean>;
  /** Couverture : groupe d'actifs → contrôle vérifié sur ce groupe. Absent tant qu'aucun actif n'est mappé. */
  assetChecks?: Record<string, boolean>;
  evidence: string;
  notes: string;
  updatedAt: string;
}

/**
 * Catégorie d'actifs du périmètre (ex. « Serveur virtuel (VM) »). L'évaluation
 * raisonne à cette maille, pas à l'instance : on vérifie qu'un contrôle est
 * couvert sur chaque catégorie applicable.
 */
export interface AssetGroup {
  id: string;
  assessmentId: string;
  name: string;
  description: string;
  /** Clé du catalogue standard quand le groupe en vient ; absente si créé à la main. */
  templateKey?: string;
  createdAt: string;
}

/** Applicabilité : ce groupe d'actifs est concerné par ce contrôle. */
export interface ControlAssetGroup {
  id: string;
  assessmentId: string;
  controlId: string;
  groupId: string;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
