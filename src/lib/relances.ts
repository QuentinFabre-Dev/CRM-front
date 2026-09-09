import { differenceInCalendarDays } from "date-fns";
import type { Contact, Interaction } from "./types";

export const RELANCE_THRESHOLD_DAYS = 60;

export function getLastContactDates(interactions: Interaction[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const interaction of interactions) {
    const current = map.get(interaction.contactId);
    if (!current || interaction.date > current) {
      map.set(interaction.contactId, interaction.date);
    }
  }
  return map;
}

export interface OverdueContact {
  contact: Contact;
  lastContactDate: string | null;
  daysSince: number | null;
}

export function getOverdueContacts(contacts: Contact[], interactions: Interaction[]): OverdueContact[] {
  const lastContactByContact = getLastContactDates(interactions);
  const now = new Date();

  return contacts
    .map((contact) => {
      const lastContactDate = lastContactByContact.get(contact.id) ?? null;
      const reference = lastContactDate ? new Date(lastContactDate) : new Date(contact.createdAt);
      const daysSince = differenceInCalendarDays(now, reference);
      return { contact, lastContactDate, daysSince };
    })
    .filter((entry) => entry.daysSince !== null && entry.daysSince >= RELANCE_THRESHOLD_DAYS)
    .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0));
}
