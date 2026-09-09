"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { uid, INTERACTION_LABELS, type InteractionType } from "@/lib/types";

export function InteractionForm({ contactId, opportunityId }: { contactId: string; opportunityId?: string }) {
  const [type, setType] = useState<InteractionType>("note");
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    await db.interactions.add({
      id: uid(),
      contactId,
      opportunityId,
      type,
      text: text.trim(),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    setText("");
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(INTERACTION_LABELS) as InteractionType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {INTERACTION_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        rows={2}
        placeholder="Ajouter une note, un compte-rendu d'appel, de lunch…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button size="sm" onClick={submit}>
        Ajouter au fil
      </Button>
    </div>
  );
}
