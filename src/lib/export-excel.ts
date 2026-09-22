import type ExcelJS from "exceljs";
import { db } from "./db";
import { average, maturityColor, maturityLabel } from "./maturity";
import { controlTitle, controlFamilyTitle, csfCategoryTitle, csfFunctionTitle, csfSubcategoryText, type Lang } from "./i18n";
import { BASELINES, sortByCsfFunctionOrder } from "./types";
import { applicableGroups, coverageFor } from "./assets";

const HEADER_FILL = "FFF1F0EA";
const BORDER_COLOR = "FFD9D7CC";

// exceljs wants ARGB without the leading '#'.
function argb(hex: string): string {
  return `FF${hex.replace("#", "").toUpperCase()}`;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, size: 10 };
  row.alignment = { vertical: "middle" };
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.border = { bottom: { style: "thin", color: { argb: BORDER_COLOR } } };
  });
}

function maturityCellFill(cell: ExcelJS.Cell, score: number | null) {
  if (score === null) return;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(maturityColor(score)) } };
  cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  cell.alignment = { horizontal: "center" };
}

export async function exportAssessmentToExcel(assessmentId: string, lang: Lang = "fr"): Promise<void> {
  const assessment = await db.assessments.get(assessmentId);
  if (!assessment) throw new Error("Évaluation introuvable");

  // ~250 kB de lib : chargée seulement au clic sur Exporter, pas dans le bundle de la page.
  const { default: ExcelJSRuntime } = await import("exceljs");

  const [
    assessmentControls,
    controls,
    csfFunctions,
    csfCategories,
    csfSubcategories,
    mappings,
    assetGroups,
    controlAssetGroups,
  ] = await Promise.all([
    db.assessmentControls.where("assessmentId").equals(assessmentId).toArray(),
    db.controls.toArray(),
    db.csfFunctions.toArray(),
    db.csfCategories.toArray(),
    db.csfSubcategories.toArray(),
    db.csfMappings.toArray(),
    db.assetGroups.where("assessmentId").equals(assessmentId).toArray(),
    db.controlAssetGroups.where("assessmentId").equals(assessmentId).toArray(),
  ]);
  const hasAssets = controlAssetGroups.length > 0;

  const controlById = new Map(controls.map((c) => [c.id, c]));
  const scoreByControlId = new Map(assessmentControls.map((ac) => [ac.controlId, ac.maturityScore]));

  const rows = assessmentControls
    .map((ac) => ({ ac, control: controlById.get(ac.controlId) }))
    .filter((r): r is { ac: (typeof assessmentControls)[number]; control: (typeof controls)[number] } => Boolean(r.control))
    .sort((a, b) => a.control.id.localeCompare(b.control.id, undefined, { numeric: true }));

  const wb = new ExcelJSRuntime.Workbook();
  wb.creator = "Control Studio";
  wb.created = new Date();

  // ---------- Onglet Résumé ----------
  const summary = wb.addWorksheet("Résumé");
  summary.columns = [{ width: 32 }, { width: 46 }];

  const scored = rows.filter(({ ac }) => ac.maturityScore !== null);
  const completion = rows.length > 0 ? Math.round((scored.length / rows.length) * 100) : 0;
  const globalAvg = average(rows.map(({ ac }) => ac.maturityScore));

  summary.addRow(["Évaluation de maturité cybersécurité"]).font = { bold: true, size: 14 };
  summary.addRow([]);
  const meta: [string, string][] = [
    ["Client / mission", assessment.clientName],
    ["Évaluateur", assessment.assessor || "—"],
    ["Baseline NIST SP 800-53B", BASELINES.find((b) => b.id === assessment.baseline)?.label ?? assessment.baseline],
    ["Date de création", new Date(assessment.createdAt).toLocaleDateString("fr-FR")],
    ["Date d'export", new Date().toLocaleDateString("fr-FR")],
    ["Statut", assessment.status === "complete" ? "Terminée" : "En cours"],
    ["Contrôles en périmètre", String(rows.length)],
    ["Contrôles évalués", `${scored.length} (${completion}%)`],
    ["Maturité moyenne", globalAvg !== null ? `${globalAvg}/5` : "—"],
  ];
  for (const [k, v] of meta) {
    const row = summary.addRow([k, v]);
    row.getCell(1).font = { bold: true, size: 10 };
    row.getCell(2).font = { size: 10 };
  }

  summary.addRow([]);
  summary.addRow(["Maturité moyenne par famille"]).font = { bold: true, size: 12 };
  const famHeader = summary.addRow(["Famille", "Maturité moyenne"]);
  styleHeaderRow(famHeader);

  const byFamily = new Map<string, { title: string; scores: (number | null)[] }>();
  for (const { ac, control } of rows) {
    const key = control.family;
    if (!byFamily.has(key)) byFamily.set(key, { title: controlFamilyTitle(control, lang), scores: [] });
    byFamily.get(key)!.scores.push(ac.maturityScore);
  }
  for (const [famId, { title, scores }] of [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const avg = average(scores);
    const row = summary.addRow([`${famId.toUpperCase()} — ${title}`, avg !== null ? avg : "Non évalué"]);
    row.getCell(1).font = { size: 10 };
    if (avg !== null) maturityCellFill(row.getCell(2), Math.round(avg));
  }

  // ---------- Onglet Contrôles ----------
  const sheet = wb.addWorksheet("Contrôles", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Contrôle", width: 14 },
    { header: "Famille", width: 30 },
    { header: "Intitulé", width: 46 },
    { header: "Maturité", width: 10 },
    { header: "Niveau", width: 16 },
    { header: "Objectifs cochés", width: 16 },
    ...(hasAssets
      ? [
          { header: "Catégories couvertes", width: 18 },
          { header: "Catégories non couvertes", width: 44 },
        ]
      : []),
    { header: "Baselines", width: 22 },
    { header: "Preuves", width: 50 },
    { header: "Notes", width: 50 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const { ac, control } of rows) {
    const checked = Object.values(ac.objectiveChecks).filter(Boolean).length;
    const totalObjectives = control.assessmentObjectives.length;

    let assetCells: (string | number)[] = [];
    if (hasAssets) {
      const applicable = applicableGroups(control.id, assetGroups, controlAssetGroups);
      const coverage = coverageFor(applicable, ac.assetChecks);
      const uncovered = applicable.filter((g) => !ac.assetChecks?.[g.id]).map((g) => g.name);
      assetCells = [coverage ? `${coverage.covered}/${coverage.total}` : "—", uncovered.join(", ")];
    }

    const row = sheet.addRow([
      control.label,
      `${control.family.toUpperCase()} — ${controlFamilyTitle(control, lang)}`,
      controlTitle(control, lang),
      ac.maturityScore ?? "",
      maturityLabel(ac.maturityScore),
      totalObjectives > 0 ? `${checked}/${totalObjectives}` : "—",
      ...assetCells,
      control.baselines.map((b) => BASELINES.find((x) => x.id === b)?.label ?? b).join(", "),
      ac.evidence,
      ac.notes,
    ]);
    row.font = { size: 10 };
    row.alignment = { vertical: "top", wrapText: true };
    maturityCellFill(row.getCell(4), ac.maturityScore);
  }
  sheet.autoFilter = { from: "A1", to: { row: 1, column: sheet.columnCount } };

  // ---------- Onglet CSF 2.0 ----------
  const csfSheet = wb.addWorksheet("CSF 2.0", { views: [{ state: "frozen", ySplit: 1 }] });
  csfSheet.columns = [
    { header: "Fonction", width: 26 },
    { header: "Catégorie", width: 34 },
    { header: "Sous-catégorie", width: 16 },
    { header: "Énoncé", width: 70 },
    { header: "Maturité moyenne", width: 16 },
    { header: "Contrôles mappés en périmètre", width: 40 },
  ];
  styleHeaderRow(csfSheet.getRow(1));

  const mappingsBySub = new Map<string, string[]>();
  for (const m of mappings) {
    if (!mappingsBySub.has(m.subcategoryId)) mappingsBySub.set(m.subcategoryId, []);
    mappingsBySub.get(m.subcategoryId)!.push(m.controlId);
  }

  for (const fn of sortByCsfFunctionOrder(csfFunctions)) {
    for (const cat of csfCategories.filter((c) => c.functionId === fn.id)) {
      for (const sub of csfSubcategories.filter((s) => s.categoryId === cat.id)) {
        const mapped = mappingsBySub.get(sub.id) ?? [];
        const inScope = mapped.filter((cid) => scoreByControlId.has(cid));
        const avg = average(inScope.map((cid) => scoreByControlId.get(cid) ?? null));
        const row = csfSheet.addRow([
          `${fn.id} — ${csfFunctionTitle(fn, lang)}`,
          `${cat.id} — ${csfCategoryTitle(cat, lang)}`,
          sub.id,
          csfSubcategoryText(sub, lang),
          avg !== null ? avg : "Non évalué",
          inScope.map((cid) => controlById.get(cid)?.label ?? cid).join(", "),
        ]);
        row.font = { size: 10 };
        row.alignment = { vertical: "top", wrapText: true };
        if (avg !== null) maturityCellFill(row.getCell(5), Math.round(avg));
      }
    }
  }
  csfSheet.autoFilter = { from: "A1", to: { row: 1, column: 6 } };

  // ---------- Onglet Actifs ----------
  if (hasAssets) {
    const assetSheet = wb.addWorksheet("Actifs", { views: [{ state: "frozen", ySplit: 1 }] });
    assetSheet.columns = [
      { header: "Catégorie d'actifs", width: 30 },
      { header: "Périmètre", width: 46 },
      { header: "Contrôles applicables", width: 18 },
      { header: "Contrôles couverts", width: 18 },
      { header: "Couverture", width: 12 },
    ];
    styleHeaderRow(assetSheet.getRow(1));

    const acByControlId = new Map(assessmentControls.map((ac) => [ac.controlId, ac]));
    for (const group of [...assetGroups].sort((a, b) => a.name.localeCompare(b.name))) {
      const groupControlIds = controlAssetGroups.filter((m) => m.groupId === group.id).map((m) => m.controlId);
      const covered = groupControlIds.filter((cid) => acByControlId.get(cid)?.assetChecks?.[group.id]).length;
      const row = assetSheet.addRow([
        group.name,
        group.description,
        groupControlIds.length,
        covered,
        groupControlIds.length > 0 ? `${Math.round((covered / groupControlIds.length) * 100)}%` : "—",
      ]);
      row.font = { size: 10 };
    }
    assetSheet.autoFilter = { from: "A1", to: { row: 1, column: 5 } };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evaluation-${assessment.clientName.replace(/\s+/g, "-").toLowerCase()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
