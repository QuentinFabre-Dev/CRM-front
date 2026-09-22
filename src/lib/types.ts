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

export type RiskCriticality = "high" | "medium" | "low";

export const RISK_CRITICALITY_LABELS: Record<RiskCriticality, string> = {
  high: "Critique",
  medium: "Important",
  low: "Complémentaire",
};

export interface AssessmentObjective {
  id: string;
  label: string;
  text: string;
  /**
   * Estimation heuristique (non officielle NIST) de la réduction de risque
   * réelle apportée par cet objectif s'il est satisfait — pour prioriser la
   * remédiation. Absent sur les référentiels générés avant son introduction.
   */
  riskCriticality?: RiskCriticality;
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

/**
 * Implementation Group CIS : palier de sécurité selon la taille et la maturité
 * de l'organisation. Les paliers sont **cumulatifs** — un IG2 applique aussi
 * tout l'IG1 — donc le champ `ig` d'un safeguard est son palier *minimum*, et
 * filtrer sur IG2 signifie « ig <= 2 », jamais « ig === 2 ».
 */
export type CisImplementationGroup = 1 | 2 | 3;

export const CIS_IMPLEMENTATION_GROUPS: { id: CisImplementationGroup; label: string; description: string }[] = [
  { id: 1, label: "IG1", description: "Hygiène cyber essentielle — socle minimal pour toute organisation." },
  { id: 2, label: "IG2", description: "Organisations gérant des données sensibles pour plusieurs métiers." },
  { id: 3, label: "IG3", description: "Organisations exposées, soumises à des exigences réglementaires fortes." },
];

export interface CisControl {
  number: number;
  title: string;
  titleFr?: string;
  description: string;
  descriptionFr?: string;
}

export interface CisSafeguard {
  /** Numérotation officielle CIS, ex. « 8.3 ». */
  id: string;
  controlNumber: number;
  title: string;
  titleFr?: string;
  description: string;
  descriptionFr?: string;
  /** Palier minimum auquel ce safeguard s'applique (cumulatif, cf. CisImplementationGroup). */
  ig: CisImplementationGroup;
  assetType: string;
}

export interface CisMapping {
  id?: number;
  safeguardId: string;
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

/** Niveau de déploiement d'un objectif d'évaluation sur une catégorie d'actifs. */
export type DeploymentLevel = "none" | "partial" | "full" | "na";

export const DEPLOYMENT_LEVELS: { id: DeploymentLevel; label: string }[] = [
  { id: "none", label: "Pas en place" },
  { id: "partial", label: "Partiellement déployé" },
  { id: "full", label: "Totalement déployé" },
  { id: "na", label: "Non applicable" },
];

export interface AssessmentControl {
  id: string;
  assessmentId: string;
  controlId: string;
  maturityScore: number | null;
  objectiveChecks: Record<string, boolean>;
  /**
   * Couverture saisie à la main : groupe d'actifs → contrôle vérifié sur ce groupe.
   * Ignorée pour un groupe dès que la matrice objectifs × actifs a une saisie pour lui.
   */
  assetChecks?: Record<string, boolean>;
  /** Matrice objectif d'évaluation → groupe d'actifs → niveau de déploiement. */
  objectiveAssetLevels?: Record<string, Record<string, DeploymentLevel>>;
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
