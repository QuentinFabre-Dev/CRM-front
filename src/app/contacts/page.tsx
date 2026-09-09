"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TagChip } from "@/components/tag-chip";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { getOverdueContacts } from "@/lib/relances";

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const contacts = useLiveQuery(() => db.contacts.toArray(), [], []);
  const interactions = useLiveQuery(() => db.interactions.toArray(), [], []);
  const tags = useLiveQuery(() => db.tags.toArray(), [], []);
  const tagById = new Map((tags ?? []).map((t) => [t.id, t]));

  const overdueIds = useMemo(
    () => new Set(getOverdueContacts(contacts ?? [], interactions ?? []).map((o) => o.contact.id)),
    [contacts, interactions]
  );

  const filtered = (contacts ?? [])
    .filter((c) => `${c.name} ${c.company}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Contacts</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{filtered.length} contact(s)</p>
        </div>
        <ContactFormDialog />
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((contact) => (
          <Link key={contact.id} href={`/contacts/${contact.id}`}>
            <Card className="p-4 transition hover:shadow-popover">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{contact.name}</p>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    {contact.role ? `${contact.role} · ` : ""}
                    {contact.company}
                  </p>
                </div>
                {overdueIds.has(contact.id) && <AlertTriangle size={15} className="shrink-0 text-danger" />}
              </div>
              {contact.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {contact.tags.map((tagId) => {
                    const tag = tagById.get(tagId);
                    return tag ? <TagChip key={tagId} tag={tag} /> : null;
                  })}
                </div>
              )}
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-[13px] text-muted-foreground">Aucun contact trouvé.</p>
        )}
      </div>
    </div>
  );
}
