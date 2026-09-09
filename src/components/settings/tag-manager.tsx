"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { uid } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TagChip } from "@/components/tag-chip";

const COLOR_SWATCHES = [
  "211 100% 50%",
  "255 65% 62%",
  "145 63% 42%",
  "32 95% 52%",
  "4 86% 58%",
  "330 70% 60%",
  "175 60% 40%",
];

export function TagManager() {
  const tags = useLiveQuery(() => db.tags.toArray(), [], []);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);

  const addTag = async () => {
    if (!label.trim()) return;
    await db.tags.add({ id: uid(), label: label.trim(), color });
    setLabel("");
  };

  const removeTag = (id: string) => db.tags.delete(id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(tags ?? []).map((tag) => (
          <div key={tag.id} className="group relative">
            <TagChip tag={tag} />
            <button
              onClick={() => removeTag(tag.id)}
              className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] text-white group-hover:flex"
            >
              <Trash2 size={9} />
            </button>
          </div>
        ))}
        {(tags ?? []).length === 0 && <p className="text-[13px] text-muted-foreground">Aucun tag pour le moment.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTag()}
          placeholder="Nouveau tag…"
          className="w-40"
        />
        <div className="flex gap-1">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-6 w-6 rounded-full ring-offset-2"
              style={{ backgroundColor: `hsl(${c})`, boxShadow: color === c ? `0 0 0 2px hsl(${c})` : undefined }}
            />
          ))}
        </div>
        <Button size="sm" onClick={addTag}>
          <Plus size={13} /> Ajouter
        </Button>
      </div>
    </div>
  );
}
