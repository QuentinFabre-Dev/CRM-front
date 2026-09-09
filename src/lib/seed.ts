import { subDays, subMonths } from "date-fns";
import { db } from "./db";
import { uid } from "./types";
import type {
  Contact,
  Interaction,
  Opportunity,
  Tag,
  Target,
  Task,
  WeeklyChargeability,
} from "./types";

const iso = (d: Date) => d.toISOString();
const now = new Date();

const DEFAULT_TAGS: Omit<Tag, "id">[] = [
  { label: "Client", color: "211 100% 50%" },
  { label: "Interne", color: "255 65% 62%" },
  { label: "Formation", color: "145 63% 42%" },
  { label: "Admin", color: "32 95% 52%" },
  { label: "Prioritaire", color: "4 86% 58%" },
];

export async function seedIfEmpty(): Promise<void> {
  const count = await db.contacts.count();
  if (count > 0) return;

  const tags: Tag[] = DEFAULT_TAGS.map((t) => ({ id: uid(), ...t }));

  const contactsSeed: { name: string; company: string; role: string; daysAgoContact: number }[] = [
    { name: "Sophie Martin", company: "TechNova", role: "DSI", daysAgoContact: 2 },
    { name: "Marc Lefèvre", company: "GreenTech", role: "CFO", daysAgoContact: 5 },
    { name: "Camille Roux", company: "Alpha Conseil", role: "COO", daysAgoContact: 71 },
    { name: "Julien Berthier", company: "BlueWave", role: "RSSI", daysAgoContact: 12 },
    { name: "Nadia Haddad", company: "Orion SA", role: "Directrice achats", daysAgoContact: 94 },
    { name: "Pierre Lambert", company: "Nova Retail", role: "CEO", daysAgoContact: 8 },
  ];

  const contacts: Contact[] = contactsSeed.map((c) => ({
    id: uid(),
    name: c.name,
    company: c.company,
    role: c.role,
    email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@${c.company.toLowerCase().replace(/\s+/g, "")}.com`,
    phone: "06 12 34 56 78",
    tags: [tags[0].id],
    createdAt: iso(subMonths(now, 6)),
  }));

  const stageByIndex = ["qualification", "decouverte", "proposition", "negociation", "ferme"] as const;
  const opportunities: Opportunity[] = contacts.map((c, i) => ({
    id: uid(),
    contactId: c.id,
    title: `Mission cybersécurité — ${c.company}`,
    stage: stageByIndex[i % stageByIndex.length],
    outcome: stageByIndex[i % stageByIndex.length] === "ferme" ? "won" : "open",
    amount: [50000, 60000, 120000, 100000, 80000, 70000][i % 6],
    expectedCloseDate: iso(subDays(now, -20 - i * 5)),
    source: ["Site web", "Recommandation", "Campagne email", "Réseaux sociaux", "Événement"][i % 5],
    createdAt: iso(subMonths(now, 3 - (i % 3))),
    updatedAt: iso(subDays(now, i)),
  }));

  const interactions: Interaction[] = [];
  contactsSeed.forEach((c, i) => {
    const contact = contacts[i];
    const opp = opportunities[i];
    interactions.push({
      id: uid(),
      contactId: contact.id,
      opportunityId: opp.id,
      type: (["appel", "email", "lunch", "note", "reunion"] as const)[i % 5],
      text:
        i % 5 === 2
          ? "Lunch de suivi — bonne dynamique, relance sur le périmètre technique à prévoir."
          : "Point d'avancement sur la mission, prochaines étapes validées.",
      date: iso(subDays(now, c.daysAgoContact)),
      createdAt: iso(subDays(now, c.daysAgoContact)),
    });
  });

  const taskTitles = [
    { title: "Appeler Sophie Martin", quadrant: "urgent-important" as const, contact: 0 },
    { title: "Préparer la démo TechNova", quadrant: "urgent-important" as const, contact: 0 },
    { title: "Relancer proposition Alpha Conseil", quadrant: "important" as const, contact: 2 },
    { title: "Envoyer contrat BlueWave", quadrant: "urgent-important" as const, contact: 3 },
    { title: "Suivi onboarding Solstice", quadrant: "important" as const },
    { title: "Ranger la boîte mail", quadrant: "neither" as const },
    { title: "Répondre au sondage interne RH", quadrant: "urgent" as const },
    { title: "Préparer newsletter mensuelle", quadrant: "important" as const },
  ];
  const tasks: Task[] = taskTitles.map((t, i) => ({
    id: uid(),
    title: t.title,
    quadrant: t.quadrant,
    tags: i % 3 === 0 ? [tags[0].id] : i % 3 === 1 ? [tags[4].id] : [],
    dueDate: iso(subDays(now, -(i + 1))),
    done: false,
    contactId: t.contact !== undefined ? contacts[t.contact].id : undefined,
    createdAt: iso(subDays(now, i)),
  }));

  const fiscalYearStart = now.getMonth() >= 9 ? new Date(now.getFullYear(), 9, 1) : new Date(now.getFullYear() - 1, 9, 1);
  const weeklyChargeability: WeeklyChargeability[] = [];
  for (let w = 0; w < 10; w++) {
    const weekStart = new Date(fiscalYearStart);
    weekStart.setDate(weekStart.getDate() + w * 7);
    if (weekStart > now) break;
    weeklyChargeability.push({
      id: uid(),
      weekStart: iso(weekStart),
      chargeableHours: 28 + Math.round(Math.random() * 8),
      totalHours: 38 + Math.round(Math.random() * 3),
      createdAt: iso(weekStart),
    });
  }

  const targets: Target[] = [
    {
      id: uid(),
      type: "chargeabilite",
      label: "Objectif de chargeabilité annuel",
      value: 80,
      unit: "%",
      period: "Année fiscale (1 oct → 30 sept)",
      createdAt: iso(now),
    },
  ];

  await db.transaction(
    "rw",
    [db.contacts, db.opportunities, db.interactions, db.tasks, db.tags, db.weeklyChargeability, db.targets],
    async () => {
      if ((await db.contacts.count()) > 0) return;
      await db.contacts.bulkAdd(contacts);
      await db.opportunities.bulkAdd(opportunities);
      await db.interactions.bulkAdd(interactions);
      await db.tasks.bulkAdd(tasks);
      await db.tags.bulkAdd(tags);
      await db.weeklyChargeability.bulkAdd(weeklyChargeability);
      await db.targets.bulkAdd(targets);
    }
  );
}
