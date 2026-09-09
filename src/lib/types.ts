export type Quadrant = "urgent-important" | "important" | "urgent" | "neither";

export const QUADRANTS: { id: Quadrant; title: string; subtitle: string }[] = [
  { id: "urgent-important", title: "Urgent & important", subtitle: "À faire maintenant" },
  { id: "important", title: "Important, pas urgent", subtitle: "À planifier" },
  { id: "urgent", title: "Urgent, pas important", subtitle: "À déléguer" },
  { id: "neither", title: "Ni l'un ni l'autre", subtitle: "À éliminer" },
];

export type OpportunityStage =
  | "qualification"
  | "decouverte"
  | "proposition"
  | "negociation"
  | "ferme";

export const STAGES: { id: OpportunityStage; title: string }[] = [
  { id: "qualification", title: "Qualification" },
  { id: "decouverte", title: "Découverte" },
  { id: "proposition", title: "Proposition" },
  { id: "negociation", title: "Négociation" },
  { id: "ferme", title: "Fermé" },
];

export type OpportunityOutcome = "open" | "won" | "lost";

export type InteractionType = "appel" | "email" | "lunch" | "note" | "reunion";

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  appel: "Appel",
  email: "Email",
  lunch: "Lunch / RDV",
  note: "Note",
  reunion: "Réunion",
};

export interface Contact {
  id: string;
  name: string;
  company: string;
  role?: string;
  email?: string;
  phone?: string;
  tags: string[];
  createdAt: string;
}

export interface Opportunity {
  id: string;
  contactId: string;
  title: string;
  stage: OpportunityStage;
  outcome: OpportunityOutcome;
  amount: number;
  expectedCloseDate?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  contactId: string;
  opportunityId?: string;
  type: InteractionType;
  text: string;
  date: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  quadrant: Quadrant;
  tags: string[];
  dueDate?: string;
  done: boolean;
  contactId?: string;
  opportunityId?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

export interface WeeklyChargeability {
  id: string;
  weekStart: string;
  chargeableHours: number;
  totalHours: number;
  createdAt: string;
}

export type TargetType = "chargeabilite" | "vente" | "autre";

export interface Target {
  id: string;
  type: TargetType;
  label: string;
  value: number;
  unit: string;
  period: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
