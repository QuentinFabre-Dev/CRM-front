// Downloads CIS Critical Security Controls v8.1 and the official CIS-authored
// crosswalk to NIST SP 800-53 Rev 5, then normalizes both into a compact
// public/data/cis.json. Run with `node scripts/fetch-cis-data.mjs`.
//
// CIS ships the Controls Navigator as a Sitecore JSS app that inlines its whole
// Apollo cache into a <script id="__JSS_STATE__"> tag — controls, safeguards and
// all 30 crosswalks are already in the HTML. That is the only public, no-login
// route to this data (the spreadsheet downloads sit behind a lead-capture form),
// so we read the cache rather than scrape the rendered DOM: the shape is a
// normalized store keyed by "<Typename>:<id>", which is far more stable than
// whatever markup the Vue components happen to emit.

import { writeFile, mkdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "data");
const CONTROLS_JSON = path.join(OUT_DIR, "controls.json");

const CIS_JSON = path.join(OUT_DIR, "cis.json");

const NAVIGATOR_URL = "https://www.cisecurity.org/controls/cis-controls-navigator";
const MAPPING_TITLE = "NIST SP 800-53 Rev. 5 All Baselines";

async function fetchNavigatorState() {
  const res = await fetch(NAVIGATOR_URL);
  if (!res.ok) throw new Error(`Failed to fetch ${NAVIGATOR_URL}: HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/<script type="application\/json" id="__JSS_STATE__">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("__JSS_STATE__ not found — the Navigator page structure changed.");
  const state = JSON.parse(match[1]);
  const cache = state.APOLLO_STATE;
  if (!cache) throw new Error("APOLLO_STATE missing from __JSS_STATE__.");
  return cache;
}

// Apollo stores field arguments in the key, so a plain `o.title` never resolves.
const field = (node, name) => node?.[`field({"name":"${name}"})`];
const text = (node, name) => field(node, name)?.value ?? "";
const number = (node, name) => field(node, name)?.numberValue ?? null;

const keysOfType = (cache, typename) =>
  Object.keys(cache).filter((k) => k.startsWith(`${typename}:`));

// "AC-6(9)" -> "ac-6.9", matching the OSCAL ids used in controls.json.
function normalizeControlId(code) {
  const m = code.trim().match(/^([A-Za-z]{2,3})-(\d+)(?:\s*\((\d+)\))?$/);
  if (!m) return null;
  const family = m[1].toLowerCase();
  const num = parseInt(m[2], 10);
  return m[3] ? `${family}-${num}.${parseInt(m[3], 10)}` : `${family}-${num}`;
}

function buildCis(cache, validControlIds) {
  const safeguardByRef = new Map();
  for (const key of keysOfType(cache, "CISControlSafeguard")) {
    const node = cache[key];
    safeguardByRef.set(key, {
      id: text(node, "number"),
      controlNumber: parseInt(text(node, "number").split(".")[0], 10),
      title: text(node, "title"),
      description: text(node, "description"),
      ig: number(node, "ig"),
      assetType: text(node, "assetType"),
    });
  }

  const controls = keysOfType(cache, "CISControl")
    .map((key) => {
      const node = cache[key];
      return {
        number: number(node, "number"),
        title: text(node, "title"),
        description: text(node, "description"),
      };
    })
    .sort((a, b) => a.number - b.number);

  const mappingKey = keysOfType(cache, "CISControlMapping").find(
    (k) => text(cache[k], "title") === MAPPING_TITLE
  );
  if (!mappingKey) {
    throw new Error(`Crosswalk "${MAPPING_TITLE}" not found among the Navigator's mappings.`);
  }

  const mappings = [];
  const seenPairs = new Set();
  const unmatchedCodes = [];

  for (const ref of cache[mappingKey].children ?? []) {
    const element = cache[ref.__ref];
    const code = text(element, "code");
    const controlId = normalizeControlId(code);
    if (!controlId || !validControlIds.has(controlId)) {
      unmatchedCodes.push(code);
      continue;
    }
    for (const target of field(element, "safeguards")?.targetItems ?? []) {
      const safeguard = safeguardByRef.get(target.__ref);
      if (!safeguard) continue;
      const pairKey = `${safeguard.id}|${controlId}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      mappings.push({ safeguardId: safeguard.id, controlId });
    }
  }

  const safeguards = [...safeguardByRef.values()].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  return { controls, safeguards, mappings, unmatchedCodes };
}

// Les traductions françaises vivent dans cis.json, pas chez le CIS : sans ce
// report, relancer le script pour capter une révision du référentiel effacerait
// silencieusement les 171 traductions.
async function carryOverTranslations(cis) {
  let previous;
  try {
    previous = JSON.parse(await readFile(CIS_JSON, "utf8"));
  } catch {
    return 0;
  }

  const frByControl = new Map((previous.controls ?? []).map((c) => [c.number, c]));
  const frBySafeguard = new Map((previous.safeguards ?? []).map((s) => [s.id, s]));
  let carried = 0;

  for (const control of cis.controls) {
    const old = frByControl.get(control.number);
    if (old?.titleFr) control.titleFr = old.titleFr;
    if (old?.descriptionFr) control.descriptionFr = old.descriptionFr;
    if (old?.titleFr) carried++;
  }
  for (const safeguard of cis.safeguards) {
    const old = frBySafeguard.get(safeguard.id);
    if (old?.titleFr) safeguard.titleFr = old.titleFr;
    if (old?.descriptionFr) safeguard.descriptionFr = old.descriptionFr;
    if (old?.titleFr) carried++;
  }
  return carried;
}

async function main() {
  console.log("Reading NIST catalog ids from controls.json...");
  const controls = JSON.parse(await readFile(CONTROLS_JSON, "utf8"));
  const validControlIds = new Set(controls.map((c) => c.id));
  console.log(`  -> ${validControlIds.size} known control ids`);

  console.log("Fetching CIS Controls Navigator...");
  const cache = await fetchNavigatorState();

  const cis = buildCis(cache, validControlIds);
  const mappedSafeguards = new Set(cis.mappings.map((m) => m.safeguardId)).size;
  console.log(
    `  -> ${cis.controls.length} controls, ${cis.safeguards.length} safeguards, ${cis.mappings.length} mappings covering ${mappedSafeguards} safeguards`
  );
  if (cis.unmatchedCodes.length) {
    console.warn(`  !! ${cis.unmatchedCodes.length} unmatched 800-53 codes:`, cis.unmatchedCodes);
  }

  if (cis.controls.length !== 18 || cis.safeguards.length !== 153) {
    console.warn(
      `  !! Expected 18 controls / 153 safeguards for v8.1 — CIS may have published a new revision.`
    );
  }

  delete cis.unmatchedCodes;
  const carried = await carryOverTranslations(cis);
  if (carried) console.log(`  -> carried over ${carried} existing French translations`);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "cis.json"), JSON.stringify(cis));
  console.log(`Wrote ${OUT_DIR}/cis.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
