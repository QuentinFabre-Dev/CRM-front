"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { formatDistanceToNow, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Mail, Phone, Building2, AlertTriangle, Trash2, Phone as PhoneIcon, Mail as MailIcon, Coffee, StickyNote, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagChip } from "@/components/tag-chip";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { InteractionForm } from "@/components/contacts/interaction-form";
import { INTERACTION_LABELS, STAGES, type InteractionType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { RELANCE_THRESHOLD_DAYS } from "@/lib/relances";

const ICONS: Record<InteractionType, typeof PhoneIcon> = {
  appel: PhoneIcon,
  email: MailIcon,
  lunch: Coffee,
  note: StickyNote,
  reunion: Users,
};

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const contact = useLiveQuery(() => db.contacts.get(params.id), [params.id]);
  const opportunities = useLiveQuery(
    () => db.opportunities.where("contactId").equals(params.id).toArray(),
    [params.id],
    []
  );
  const interactions = useLiveQuery(
    () => db.interactions.where("contactId").equals(params.id).reverse().sortBy("date"),
    [params.id],
    []
  );
  const tags = useLiveQuery(() => db.tags.toArray(), [], []);
  const tagById = new Map((tags ?? []).map((t) => [t.id, t]));

  if (contact === undefined) return null;
  if (contact === null) {
    return <p className="text-[13px] text-muted-foreground">Contact introuvable.</p>;
  }

  const sortedInteractions = [...(interactions ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const lastContactDate = sortedInteractions[0]?.date ?? null;
  const daysSince = differenceInCalendarDays(new Date(), new Date(lastContactDate ?? contact.createdAt));
  const isOverdue = daysSince >= RELANCE_THRESHOLD_DAYS;

  const remove = async () => {
    await db.contacts.delete(contact.id);
    router.push("/contacts");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Contacts
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">{contact.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Building2 size={13} />
              {contact.role ? `${contact.role} · ` : ""}
              {contact.company}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ContactFormDialog contact={contact} trigger={<Button variant="outline" size="sm">Modifier</Button>} />
            <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} className="text-danger" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
          {contact.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={13} /> {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1.5">
              <Phone size={13} /> {contact.phone}
            </span>
          )}
        </div>

        {contact.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {contact.tags.map((tagId) => {
              const tag = tagById.get(tagId);
              return tag ? <TagChip key={tagId} tag={tag} /> : null;
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          {isOverdue ? (
            <Badge variant="danger" className="gap-1">
              <AlertTriangle size={11} /> {daysSince} jours sans contact
            </Badge>
          ) : (
            <Badge variant="success">Dernier contact il y a {daysSince} jour{daysSince > 1 ? "s" : ""}</Badge>
          )}
        </div>

        {confirmDelete && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-danger/30 bg-danger/5 p-3 text-[13px]">
            <span>Supprimer définitivement ce contact ?</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
              <Button size="sm" variant="danger" onClick={remove}>
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Card>

      {opportunities && opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opportunités liées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href="/opportunites"
                className="flex items-center justify-between rounded-lg px-2 py-2 -mx-2 hover:bg-muted"
              >
                <div>
                  <p className="text-[13px] font-medium">{opp.title}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {STAGES.find((s) => s.id === opp.stage)?.title}
                  </p>
                </div>
                <span className="text-[13px] font-medium">{formatCurrency(opp.amount)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fil chronologique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InteractionForm contactId={contact.id} />
          <ol className="space-y-4 border-l border-border pl-4">
            {sortedInteractions.map((interaction) => {
              const Icon = ICONS[interaction.type];
              return (
                <li key={interaction.id} className="relative">
                  <span className="absolute -left-[21px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                    <Icon size={9} />
                  </span>
                  <p className="text-[12px] text-muted-foreground">
                    {INTERACTION_LABELS[interaction.type]} ·{" "}
                    {formatDistanceToNow(new Date(interaction.date), { addSuffix: true, locale: fr })}
                  </p>
                  <p className="mt-0.5 text-[13px]">{interaction.text}</p>
                </li>
              );
            })}
            {sortedInteractions.length === 0 && (
              <p className="text-[13px] text-muted-foreground">Aucune interaction enregistrée.</p>
            )}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
