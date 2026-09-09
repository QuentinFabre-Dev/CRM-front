"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { QUADRANTS, type Quadrant } from "@/lib/types";
import { TaskCard } from "@/components/tasks/task-card";
import { QuickAdd } from "@/components/tasks/quick-add";
import { cn } from "@/lib/utils";

const QUADRANT_TINTS: Record<Quadrant, string> = {
  "urgent-important": "hsl(var(--danger))",
  important: "hsl(var(--accent))",
  urgent: "hsl(var(--warning))",
  neither: "hsl(var(--muted-foreground))",
};

export default function TachesPage() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const tags = useLiveQuery(() => db.tags.toArray(), [], []);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<Quadrant | null>(null);

  const moveTo = async (id: string, quadrant: Quadrant) => {
    await db.tasks.update(id, { quadrant });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Matrice d&apos;Eisenhower</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Glissez une tâche pour changer de quadrant · maintenez le clic dessus pour lui poser un tag via la roue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUADRANTS.map((q) => {
          const items = (tasks ?? []).filter((t) => t.quadrant === q.id).sort((a, b) => Number(a.done) - Number(b.done));
          return (
            <div
              key={q.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverQuadrant(q.id);
              }}
              onDragLeave={() => setDragOverQuadrant((s) => (s === q.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/task-id");
                if (id) moveTo(id, q.id);
                setDragOverQuadrant(null);
              }}
              className={cn(
                "min-h-[260px] rounded-xl border border-border bg-surface-2/60 p-4 transition-colors",
                dragOverQuadrant === q.id && "border-accent bg-accent/5"
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: QUADRANT_TINTS[q.id] }} />
                <div>
                  <p className="text-[13px] font-semibold">{q.title}</p>
                  <p className="text-[11px] text-muted-foreground">{q.subtitle}</p>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} tags={tags ?? []} />
                ))}
                {items.length === 0 && (
                  <p className="py-2 text-[12px] text-muted-foreground">Aucune tâche.</p>
                )}
              </div>
              <QuickAdd quadrant={q.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
