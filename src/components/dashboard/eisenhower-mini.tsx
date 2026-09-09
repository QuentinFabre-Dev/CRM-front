"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { QUADRANTS, type Quadrant } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QUADRANT_TINTS: Record<Quadrant, string> = {
  "urgent-important": "hsl(var(--danger))",
  important: "hsl(var(--accent))",
  urgent: "hsl(var(--warning))",
  neither: "hsl(var(--muted-foreground))",
};

export function EisenhowerMini() {
  const tasks = useLiveQuery(() => db.tasks.filter((t) => !t.done).toArray(), [], []);

  const toggle = (id: string) => db.tasks.update(id, { done: true });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tâches — la matrice</CardTitle>
        <Link href="/taches" className="flex items-center gap-1 text-[12px] text-accent hover:underline">
          Ouvrir <ArrowUpRight size={12} />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUADRANTS.map((q) => {
            const items = (tasks ?? []).filter((t) => t.quadrant === q.id);
            return (
              <div key={q.id} className="rounded-sm border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: QUADRANT_TINTS[q.id] }} />
                    <span className="text-[12px] font-medium">{q.title}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{items.length}</span>
                </div>
                <ul className="space-y-1.5">
                  {items.slice(0, 3).map((task) => (
                    <li key={task.id}>
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          onChange={() => toggle(task.id)}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-border accent-accent"
                        />
                        <span className="text-[12.5px] leading-snug">{task.title}</span>
                      </label>
                    </li>
                  ))}
                  {items.length === 0 && <li className="text-[11.5px] text-muted-foreground">Rien ici.</li>}
                  {items.length > 3 && (
                    <li className={cn("text-[11px] text-muted-foreground")}>+{items.length - 3} autre(s)</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
