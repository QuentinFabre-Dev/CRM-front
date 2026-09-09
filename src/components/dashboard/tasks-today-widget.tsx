"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export function TasksTodayWidget() {
  const tasks = useLiveQuery(
    () => db.tasks.filter((t) => !t.done && !!t.dueDate && isToday(new Date(t.dueDate!))).toArray(),
    [],
    []
  );

  const toggle = (id: string, done: boolean) => db.tasks.update(id, { done: !done });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tâches du jour</CardTitle>
        <Link href="/taches" className="text-[12px] text-accent hover:underline">
          Voir tout
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {!tasks || tasks.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Rien de prévu aujourd&apos;hui.</p>
        ) : (
          tasks.map((task) => (
            <label
              key={task.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 -mx-2 hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggle(task.id, task.done)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              <span className="text-[13px]">{task.title}</span>
            </label>
          ))
        )}
      </CardContent>
    </Card>
  );
}
