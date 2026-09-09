import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMilliseconds,
} from "date-fns";

export type PeriodKey = "today" | "week" | "month" | "year";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette année",
};

export interface PeriodRange {
  start: Date;
  end: Date;
}

export function getPeriodRange(period: PeriodKey, reference: Date = new Date()): PeriodRange {
  switch (period) {
    case "today":
      return { start: startOfDay(reference), end: endOfDay(reference) };
    case "week":
      return { start: startOfWeek(reference, { weekStartsOn: 1 }), end: endOfWeek(reference, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
    case "year":
      return { start: startOfYear(reference), end: endOfYear(reference) };
  }
}

export function getPreviousPeriodRange(period: PeriodKey, reference: Date = new Date()): PeriodRange {
  const current = getPeriodRange(period, reference);
  const durationMs = current.end.getTime() - current.start.getTime();
  const prevEnd = subMilliseconds(current.start, 1);
  const prevStart = subMilliseconds(prevEnd, durationMs);
  return { start: prevStart, end: prevEnd };
}

export function isWithin(dateIso: string, range: PeriodRange): boolean {
  const t = new Date(dateIso).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}
