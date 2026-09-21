export type Baseline = "low" | "moderate" | "high" | "privacy";

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
  label: string;
  title: string;
  statement: StatementPart[];
  discussion: string;
  assessmentObjectives: AssessmentObjective[];
  assessmentMethods: AssessmentMethod[];
  baselines: Baseline[];
}

export interface CsfFunction {
  id: string;
  title: string;
  text: string;
}

export interface CsfCategory {
  id: string;
  functionId: string;
  title: string;
  text: string;
}

export interface CsfSubcategory {
  id: string;
  categoryId: string;
  functionId: string;
  text: string;
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
  evidence: string;
  notes: string;
  updatedAt: string;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
