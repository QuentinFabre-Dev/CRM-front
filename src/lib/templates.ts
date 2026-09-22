import { db } from "./db";
import { uid, type ControlTemplate } from "./types";

export const TEMPLATE_FILE_VERSION = 1;

export interface ControlTemplateFile {
  kind: "control-studio-template";
  version: number;
  name: string;
  description: string;
  controlIds: string[];
  exportedAt: string;
}

export async function saveTemplate(
  input: { id?: string; name: string; description: string; controlIds: string[] }
): Promise<string> {
  const now = new Date().toISOString();
  if (input.id) {
    await db.controlTemplates.update(input.id, {
      name: input.name.trim(),
      description: input.description.trim(),
      controlIds: input.controlIds,
      updatedAt: now,
    });
    return input.id;
  }
  const id = uid();
  await db.controlTemplates.add({
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    controlIds: input.controlIds,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.controlTemplates.delete(id);
}

export function downloadTemplate(template: ControlTemplate): void {
  const payload: ControlTemplateFile = {
    kind: "control-studio-template",
    version: TEMPLATE_FILE_VERSION,
    name: template.name,
    description: template.description,
    controlIds: template.controlIds,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `modele-${template.name.replace(/\s+/g, "-").toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface TemplateImportResult {
  templateId: string;
  name: string;
  imported: number;
  unknownIds: string[];
}

/**
 * Les ids inconnus sont écartés plutôt que bloquants : un modèle peut venir d'une
 * version de référentiel différente, on importe ce qui est reconnu et on le signale.
 */
export async function importTemplateFile(text: string): Promise<TemplateImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Fichier illisible : JSON invalide.");
  }

  const file = parsed as Partial<ControlTemplateFile>;
  if (file?.kind !== "control-studio-template" || !Array.isArray(file.controlIds)) {
    throw new Error("Ce fichier n'est pas un modèle de contrôles Control Studio.");
  }
  const name = typeof file.name === "string" && file.name.trim() ? file.name.trim() : "Modèle importé";

  const requested = file.controlIds.filter((id): id is string => typeof id === "string");
  const existing = await db.controls.bulkGet(requested);
  const known: string[] = [];
  const unknownIds: string[] = [];
  requested.forEach((id, i) => (existing[i] ? known.push(id) : unknownIds.push(id)));

  if (known.length === 0) throw new Error("Aucun contrôle de ce modèle n'existe dans le référentiel embarqué.");

  const templateId = await saveTemplate({
    name,
    description: typeof file.description === "string" ? file.description : "",
    controlIds: known,
  });

  return { templateId, name, imported: known.length, unknownIds };
}
