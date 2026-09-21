// Downloads the official NIST SP 800-53 Rev 5 catalog (with 800-53A assessment
// objectives embedded), the four SP 800-53B baseline profiles, and the NIST CSF 2.0
// Reference Tool data (with its official OLIR crosswalk to SP 800-53), then
// normalizes everything into compact JSON bundled under public/data/. Run with
// `node scripts/fetch-nist-data.mjs`. Network access required only at build time —
// the app itself never calls out to NIST at runtime.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "data");

const OSCAL_BASE =
  "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json";
const CSF_URL = "https://csrc.nist.gov/extensions/nudp/services/json/csf/elements";

const BASELINE_FILES = {
  low: "NIST_SP-800-53_rev5_LOW-baseline-resolved-profile_catalog.json",
  moderate: "NIST_SP-800-53_rev5_MODERATE-baseline-resolved-profile_catalog.json",
  high: "NIST_SP-800-53_rev5_HIGH-baseline-resolved-profile_catalog.json",
  privacy: "NIST_SP-800-53_rev5_PRIVACY-baseline-resolved-profile_catalog.json",
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return res.json();
}

function paramLabel(control, paramId) {
  const p = (control.params || []).find((x) => x.id === paramId);
  return p?.label ? `[${p.label}]` : "[organization-defined parameter]";
}

// Replaces OSCAL "{{ insert: param, <id> }}" placeholders with the parameter's
// human-readable label, e.g. "[organization-defined personnel or roles]".
function renderProse(control, prose) {
  if (!prose) return "";
  return prose.replace(/\{\{\s*insert:\s*param,\s*([\w.-]+)\s*\}\}/g, (_, id) =>
    paramLabel(control, id)
  );
}

function partLabel(part) {
  return (part.props || []).find((p) => p.name === "label")?.value ?? "";
}

// Recursively converts a statement/guidance "part" tree into a lean {label, prose, parts} tree.
function renderPartTree(control, part) {
  const node = {
    label: partLabel(part),
    prose: renderProse(control, part.prose),
  };
  if (part.parts?.length) {
    node.parts = part.parts.map((p) => renderPartTree(control, p));
  }
  return node;
}

// Flattens the (possibly nested) assessment-objective tree into leaf checklist items.
function flattenAssessmentObjectives(control, part, acc) {
  const hasChildren = part.parts?.length > 0;
  if (!hasChildren && part.prose) {
    acc.push({
      id: part.id,
      label: partLabel(part),
      text: renderProse(control, part.prose),
    });
    return;
  }
  for (const child of part.parts || []) {
    flattenAssessmentObjectives(control, child, acc);
  }
}

function normalizeControl(raw, family, familyTitle) {
  const statementPart = raw.parts?.find((p) => p.name === "statement");
  const guidancePart = raw.parts?.find((p) => p.name === "guidance");
  const objectivePart = raw.parts?.find((p) => p.name === "assessment-objective");
  const methodParts = raw.parts?.filter((p) => p.name === "assessment-method") ?? [];

  const assessmentObjectives = [];
  if (objectivePart) flattenAssessmentObjectives(raw, objectivePart, assessmentObjectives);

  const assessmentMethods = methodParts.map((mp) => ({
    method: (mp.props || []).find((p) => p.name === "method")?.value ?? "",
    objects: renderProse(
      raw,
      mp.parts?.find((p) => p.name === "assessment-objects")?.prose ?? ""
    ),
  }));

  const displayLabel =
    (raw.props || []).find((p) => p.name === "label" && !p.class)?.value ?? raw.id.toUpperCase();

  const baseId = raw.id.includes(".") ? raw.id.split(".")[0] : null;

  return {
    id: raw.id,
    baseId,
    isEnhancement: Boolean(baseId),
    family,
    familyTitle,
    label: displayLabel,
    title: raw.title,
    statement: statementPart ? renderPartTree(raw, statementPart).parts ?? [] : [],
    discussion: guidancePart
      ? (guidancePart.prose ? renderProse(raw, guidancePart.prose) : "") +
        (guidancePart.parts || [])
          .map((p) => renderProse(raw, p.prose))
          .filter(Boolean)
          .join("\n\n")
      : "",
    assessmentObjectives,
    assessmentMethods,
    baselines: [],
  };
}

function walkControls(controls, family, familyTitle, out) {
  for (const raw of controls) {
    out.push(normalizeControl(raw, family, familyTitle));
    if (raw.controls?.length) walkControls(raw.controls, family, familyTitle, out);
  }
}

function collectBaselineIds(baselineCatalog) {
  const ids = new Set();
  function walk(controls) {
    for (const c of controls) {
      ids.add(c.id);
      if (c.controls?.length) walk(c.controls);
    }
  }
  baselineCatalog.catalog.groups.forEach((g) => walk(g.controls || []));
  return ids;
}

function normalizeControlIdForCsf(elementIdentifier) {
  const m = elementIdentifier.match(/^([A-Za-z]+)-(\d+)(?:\((\d+)\))?$/);
  if (!m) return elementIdentifier.toLowerCase();
  const family = m[1].toLowerCase();
  const num = parseInt(m[2], 10);
  const enhancement = m[3] ? parseInt(m[3], 10) : null;
  return enhancement ? `${family}-${num}.${enhancement}` : `${family}-${num}`;
}

function buildCsf(csfRaw, validControlIds) {
  const functions = csfRaw.response.elements.filter((e) => e.elementTypeIdentifier === "function");
  const flatFunctions = [];
  const flatCategories = [];
  const flatSubcategories = [];
  const mappings = [];
  const seenPairs = new Set();

  for (const fn of functions) {
    flatFunctions.push({ id: fn.elementIdentifier, title: fn.title, text: fn.text });
    const categories = (fn.elements || []).filter((e) => e.elementTypeIdentifier === "category");
    for (const cat of categories) {
      flatCategories.push({
        id: cat.elementIdentifier,
        functionId: fn.elementIdentifier,
        title: cat.title,
        text: cat.text,
      });
      const subs = (cat.elements || []).filter((e) => e.elementTypeIdentifier === "subcategory");
      for (const sub of subs) {
        const withdrawn = (sub.elements || []).some((c) => c.elementTypeIdentifier === "withdraw_reason");
        if (withdrawn) continue;
        flatSubcategories.push({
          id: sub.elementIdentifier,
          categoryId: cat.elementIdentifier,
          functionId: fn.elementIdentifier,
          text: sub.text,
        });
        for (const rel of sub.externalRelationships || []) {
          if (!rel.shortName?.startsWith("SP 800-53 Rev 5")) continue;
          const controlId = normalizeControlIdForCsf(rel.elementIdentifier);
          if (!validControlIds.has(controlId)) continue;
          const pairKey = `${sub.elementIdentifier}|${controlId}`;
          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);
          mappings.push({ subcategoryId: sub.elementIdentifier, controlId });
        }
      }
    }
  }

  return { functions: flatFunctions, categories: flatCategories, subcategories: flatSubcategories, mappings };
}

async function main() {
  console.log("Fetching NIST SP 800-53 Rev 5 catalog...");
  const catalogRaw = await fetchJson(`${OSCAL_BASE}/NIST_SP-800-53_rev5_catalog.json`);

  const controls = [];
  for (const group of catalogRaw.catalog.groups) {
    walkControls(group.controls || [], group.id, group.title, controls);
  }
  console.log(`  -> ${controls.length} controls (incl. enhancements)`);

  const controlById = new Map(controls.map((c) => [c.id, c]));

  for (const [baselineKey, filename] of Object.entries(BASELINE_FILES)) {
    console.log(`Fetching baseline: ${baselineKey}...`);
    const baselineRaw = await fetchJson(`${OSCAL_BASE}/${filename}`);
    const ids = collectBaselineIds(baselineRaw);
    for (const id of ids) {
      controlById.get(id)?.baselines.push(baselineKey);
    }
    console.log(`  -> ${ids.size} controls in ${baselineKey} baseline`);
  }

  console.log("Fetching NIST CSF 2.0 Reference Tool data...");
  const csfRaw = await fetchJson(CSF_URL);
  const validControlIds = new Set(controls.map((c) => c.id));
  const csf = buildCsf(csfRaw, validControlIds);
  console.log(
    `  -> ${csf.functions.length} functions, ${csf.categories.length} categories, ${csf.subcategories.length} active subcategories, ${csf.mappings.length} control mappings`
  );

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "controls.json"), JSON.stringify(controls));
  await writeFile(path.join(OUT_DIR, "csf.json"), JSON.stringify(csf));
  console.log(`Wrote ${OUT_DIR}/controls.json and ${OUT_DIR}/csf.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
