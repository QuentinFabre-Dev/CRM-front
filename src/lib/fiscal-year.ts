import type { WeeklyChargeability } from "./types";

export interface FiscalYearRange {
  start: Date;
  end: Date;
  label: string;
}

export function getFiscalYearRange(reference: Date = new Date()): FiscalYearRange {
  const year = reference.getMonth() >= 9 ? reference.getFullYear() : reference.getFullYear() - 1;
  const start = new Date(year, 9, 1);
  const end = new Date(year + 1, 8, 30, 23, 59, 59);
  return { start, end, label: `1 oct ${year} → 30 sept ${year + 1}` };
}

export function isInFiscalYear(dateIso: string, range: FiscalYearRange): boolean {
  const t = new Date(dateIso).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export interface ChargeabilitySummary {
  chargeableHours: number;
  totalHours: number;
  percentage: number;
  weeksLogged: number;
}

export function summarizeChargeability(
  entries: WeeklyChargeability[],
  range: FiscalYearRange
): ChargeabilitySummary {
  const inRange = entries.filter((e) => isInFiscalYear(e.weekStart, range));
  const chargeableHours = inRange.reduce((sum, e) => sum + e.chargeableHours, 0);
  const totalHours = inRange.reduce((sum, e) => sum + e.totalHours, 0);
  const percentage = totalHours > 0 ? Math.round((chargeableHours / totalHours) * 1000) / 10 : 0;
  return { chargeableHours, totalHours, percentage, weeksLogged: inRange.length };
}
