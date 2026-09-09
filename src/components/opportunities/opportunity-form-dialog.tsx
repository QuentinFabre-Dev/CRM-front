"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { uid, STAGES, type Opportunity, type OpportunityStage } from "@/lib/types";

const SOURCES = ["Site web", "Recommandation", "Campagne email", "Réseaux sociaux", "Événement", "Autres"];

export function OpportunityFormDialog({
  opportunity,
  defaultContactId,
  trigger,
}: {
  opportunity?: Opportunity;
  defaultContactId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contacts = useLiveQuery(() => db.contacts.toArray(), [], []);
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [stage, setStage] = useState<OpportunityStage>("qualification");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  useEffect(() => {
    if (!open) return;
    if (opportunity) {
      setTitle(opportunity.title);
      setContactId(opportunity.contactId);
      setStage(opportunity.stage);
      setAmount(String(opportunity.amount));
      setSource(opportunity.source ?? SOURCES[0]);
      setExpectedCloseDate(opportunity.expectedCloseDate?.slice(0, 10) ?? "");
    } else {
      setTitle("");
      setContactId(defaultContactId ?? "");
      setStage("qualification");
      setAmount("");
      setSource(SOURCES[0]);
      setExpectedCloseDate("");
    }
  }, [open, opportunity, defaultContactId]);

  const save = async () => {
    if (!title.trim() || !contactId) return;
    const now = new Date().toISOString();
    if (opportunity) {
      await db.opportunities.update(opportunity.id, {
        title: title.trim(),
        contactId,
        stage,
        amount: Number(amount) || 0,
        source,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : undefined,
        updatedAt: now,
      });
    } else {
      await db.opportunities.add({
        id: uid(),
        title: title.trim(),
        contactId,
        stage,
        outcome: "open",
        amount: Number(amount) || 0,
        source,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus size={14} /> Nouvelle opportunité
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{opportunity ? "Modifier l'opportunité" : "Nouvelle opportunité"}</DialogTitle>
        <div className="space-y-3">
          <div>
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un contact" />
              </SelectTrigger>
              <SelectContent>
                {(contacts ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Étape</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as OpportunityStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant (€)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Échéance prévue</Label>
              <Input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={save} disabled={!contactId}>
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
