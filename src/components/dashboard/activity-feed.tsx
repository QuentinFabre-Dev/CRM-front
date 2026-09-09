"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Phone, Mail, Coffee, StickyNote, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { INTERACTION_LABELS, type InteractionType } from "@/lib/types";

const ICONS: Record<InteractionType, typeof Phone> = {
  appel: Phone,
  email: Mail,
  lunch: Coffee,
  note: StickyNote,
  reunion: Users,
};

export function ActivityFeed() {
  const interactions = useLiveQuery(
    () => db.interactions.orderBy("date").reverse().limit(6).toArray(),
    [],
    []
  );
  const contacts = useLiveQuery(() => db.contacts.toArray(), [], []);
  const contactById = new Map((contacts ?? []).map((c) => [c.id, c]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {!interactions || interactions.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Aucune activité pour le moment.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {interactions.map((interaction) => {
              const Icon = ICONS[interaction.type];
              const contact = contactById.get(interaction.contactId);
              return (
                <li key={interaction.id} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px]">
                      <span className="font-medium">{INTERACTION_LABELS[interaction.type]}</span>
                      {contact ? ` · ${contact.name}` : ""}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {formatDistanceToNow(new Date(interaction.date), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
