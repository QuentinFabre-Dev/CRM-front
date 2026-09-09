"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagChip } from "@/components/tag-chip";
import { db } from "@/lib/db";
import { uid, type Contact } from "@/lib/types";

const EMPTY = { name: "", company: "", role: "", email: "", phone: "" };

export function ContactFormDialog({ contact, trigger }: { contact?: Contact; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const tags = useLiveQuery(() => db.tags.toArray(), [], []);

  useEffect(() => {
    if (!open) return;
    if (contact) {
      setForm({
        name: contact.name,
        company: contact.company,
        role: contact.role ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
      });
      setTagIds(contact.tags);
    } else {
      setForm(EMPTY);
      setTagIds([]);
    }
  }, [open, contact]);

  const toggleTag = (id: string) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const save = async () => {
    if (!form.name.trim() || !form.company.trim()) return;
    if (contact) {
      await db.contacts.update(contact.id, { ...form, tags: tagIds });
    } else {
      await db.contacts.add({
        id: uid(),
        ...form,
        tags: tagIds,
        createdAt: new Date().toISOString(),
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus size={14} /> Nouveau contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{contact ? "Modifier le contact" : "Nouveau contact"}</DialogTitle>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Société</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Fonction</Label>
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          {tags && tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <TagChip key={tag.id} tag={tag} active={tagIds.includes(tag.id)} onClick={() => toggleTag(tag.id)} />
                ))}
              </div>
            </div>
          )}
          <Button className="w-full" onClick={save}>
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
