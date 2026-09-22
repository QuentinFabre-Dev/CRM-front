import { db } from "./db";
import type { CisControl, CisMapping, CisSafeguard, Control, CsfMapping } from "./types";

interface CsfDataset {
  functions: { id: string; title: string; text: string }[];
  categories: { id: string; functionId: string; title: string; text: string }[];
  subcategories: { id: string; categoryId: string; functionId: string; text: string }[];
  mappings: CsfMapping[];
}

interface CisDataset {
  controls: CisControl[];
  safeguards: CisSafeguard[];
  mappings: CisMapping[];
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Impossible de charger ${label}.`);
  return res.json() as Promise<T>;
}

// Le NIST et le CIS sont chargés séparément : un référentiel ajouté après coup
// doit atterrir chez les utilisateurs qui ont déjà la base peuplée, ce qu'un
// unique drapeau « déjà seedé » empêcherait définitivement.
async function seedNist(): Promise<void> {
  if ((await db.controls.count()) > 0) return;

  const [controls, csf] = await Promise.all([
    fetchJson<Control[]>("/data/controls.json", "le référentiel NIST embarqué"),
    fetchJson<CsfDataset>("/data/csf.json", "le référentiel CSF 2.0 embarqué"),
  ]);

  await db.transaction(
    "rw",
    [db.controls, db.csfFunctions, db.csfCategories, db.csfSubcategories, db.csfMappings],
    async () => {
      if ((await db.controls.count()) > 0) return;
      await db.controls.bulkAdd(controls);
      await db.csfFunctions.bulkAdd(csf.functions);
      await db.csfCategories.bulkAdd(csf.categories);
      await db.csfSubcategories.bulkAdd(csf.subcategories);
      await db.csfMappings.bulkAdd(csf.mappings);
    }
  );
}

async function seedCis(): Promise<void> {
  if ((await db.cisControls.count()) > 0) return;

  const cis = await fetchJson<CisDataset>("/data/cis.json", "le référentiel CIS Controls embarqué");

  await db.transaction("rw", [db.cisControls, db.cisSafeguards, db.cisMappings], async () => {
    if ((await db.cisControls.count()) > 0) return;
    await db.cisControls.bulkAdd(cis.controls);
    await db.cisSafeguards.bulkAdd(cis.safeguards);
    await db.cisMappings.bulkAdd(cis.mappings);
  });
}

export async function seedReferenceData(): Promise<void> {
  await seedNist();
  await seedCis();
}
