import { MATURITY_LEVELS } from "./types";
import { STATUS } from "./chart-colors";

// RAG-style bucketing onto the fixed status palette — never a color alone,
// always paired with the numeric score / level label in the UI.
export function maturityColor(score: number | null): string {
  if (score === null) return "#c3c2b7";
  if (score <= 1) return STATUS.critical;
  if (score === 2) return STATUS.serious;
  if (score === 3) return STATUS.warning;
  return STATUS.good;
}

export function maturityLabel(score: number | null): string {
  if (score === null) return "Non évalué";
  return MATURITY_LEVELS.find((l) => l.score === score)?.label ?? "—";
}

export function average(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((sum, s) => sum + s, 0) / valid.length) * 10) / 10;
}
