import { db } from "./db";
import type { Control, CsfMapping } from "./types";

interface CsfDataset {
  functions: { id: string; title: string; text: string }[];
  categories: { id: string; functionId: string; title: string; text: string }[];
  subcategories: { id: string; categoryId: string; functionId: string; text: string }[];
  mappings: CsfMapping[];
}

export async function seedReferenceData(): Promise<void> {
  const alreadySeeded = (await db.controls.count()) > 0;
  if (alreadySeeded) return;

  const [controlsRes, csfRes] = await Promise.all([fetch("/data/controls.json"), fetch("/data/csf.json")]);
  if (!controlsRes.ok || !csfRes.ok) {
    throw new Error("Impossible de charger le référentiel NIST embarqué.");
  }
  const controls: Control[] = await controlsRes.json();
  const csf: CsfDataset = await csfRes.json();

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
