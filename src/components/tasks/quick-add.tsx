"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { uid, type Quadrant } from "@/lib/types";

export function QuickAdd({ quadrant }: { quadrant: Quadrant }) {
  const [title, setTitle] = useState("");

  const submit = async () => {
    if (!title.trim()) return;
    await db.tasks.add({
      id: uid(),
      title: title.trim(),
      quadrant,
      tags: [],
      done: false,
      createdAt: new Date().toISOString(),
    });
    setTitle("");
  };

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Ajouter une tâche…"
        className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[12.5px] outline-none placeholder:text-muted-foreground focus:border-border focus:bg-surface"
      />
      <button onClick={submit} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
        <Plus size={14} />
      </button>
    </div>
  );
}
