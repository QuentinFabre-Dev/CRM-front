import Dexie, { type Table } from "dexie";
import type {
  Contact,
  Interaction,
  Opportunity,
  Setting,
  Tag,
  Target,
  Task,
  WeeklyChargeability,
} from "./types";

export class NexaCrmDatabase extends Dexie {
  contacts!: Table<Contact, string>;
  opportunities!: Table<Opportunity, string>;
  interactions!: Table<Interaction, string>;
  tasks!: Table<Task, string>;
  tags!: Table<Tag, string>;
  weeklyChargeability!: Table<WeeklyChargeability, string>;
  targets!: Table<Target, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("nexacrm");
    this.version(1).stores({
      contacts: "id, name, company, createdAt",
      opportunities: "id, contactId, stage, outcome, createdAt",
      interactions: "id, contactId, opportunityId, date, createdAt",
      tasks: "id, quadrant, done, createdAt",
      tags: "id, label",
      weeklyChargeability: "id, weekStart",
      targets: "id, type",
      settings: "key",
    });
  }
}

export const db = typeof window !== "undefined" ? new NexaCrmDatabase() : (null as unknown as NexaCrmDatabase);

export const EXPORT_VERSION = 1;

export interface ExportPayload {
  version: number;
  exportedAt: string;
  contacts: Contact[];
  opportunities: Opportunity[];
  interactions: Interaction[];
  tasks: Task[];
  tags: Tag[];
  weeklyChargeability: WeeklyChargeability[];
  targets: Target[];
  settings: Setting[];
}

export async function exportDatabase(): Promise<ExportPayload> {
  const [contacts, opportunities, interactions, tasks, tags, weeklyChargeability, targets, settings] =
    await Promise.all([
      db.contacts.toArray(),
      db.opportunities.toArray(),
      db.interactions.toArray(),
      db.tasks.toArray(),
      db.tags.toArray(),
      db.weeklyChargeability.toArray(),
      db.targets.toArray(),
      db.settings.toArray(),
    ]);
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    contacts,
    opportunities,
    interactions,
    tasks,
    tags,
    weeklyChargeability,
    targets,
    settings,
  };
}

export async function importDatabase(payload: ExportPayload): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.contacts,
      db.opportunities,
      db.interactions,
      db.tasks,
      db.tags,
      db.weeklyChargeability,
      db.targets,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.contacts.clear(),
        db.opportunities.clear(),
        db.interactions.clear(),
        db.tasks.clear(),
        db.tags.clear(),
        db.weeklyChargeability.clear(),
        db.targets.clear(),
        db.settings.clear(),
      ]);
      await Promise.all([
        db.contacts.bulkAdd(payload.contacts ?? []),
        db.opportunities.bulkAdd(payload.opportunities ?? []),
        db.interactions.bulkAdd(payload.interactions ?? []),
        db.tasks.bulkAdd(payload.tasks ?? []),
        db.tags.bulkAdd(payload.tags ?? []),
        db.weeklyChargeability.bulkAdd(payload.weeklyChargeability ?? []),
        db.targets.bulkAdd(payload.targets ?? []),
        db.settings.bulkAdd(payload.settings ?? []),
      ]);
    }
  );
}

export async function clearDatabase(): Promise<void> {
  await Promise.all([
    db.contacts.clear(),
    db.opportunities.clear(),
    db.interactions.clear(),
    db.tasks.clear(),
    db.tags.clear(),
    db.weeklyChargeability.clear(),
    db.targets.clear(),
    db.settings.clear(),
  ]);
}
