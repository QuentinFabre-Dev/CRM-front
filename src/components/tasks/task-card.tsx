"use client";

import { useRef, useState } from "react";
import { db } from "@/lib/db";
import { TagChip } from "@/components/tag-chip";
import { RadialTagPicker } from "@/components/radial-tag-picker";
import type { Tag, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 380;
const MOVE_CANCEL_PX = 8;

export function TaskCard({ task, tags }: { task: Task; tags: Tag[] }) {
  const [wheelOrigin, setWheelOrigin] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const tagById = new Map(tags.map((t) => [t.id, t]));

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      setWheelOrigin({ x: e.clientX, y: e.clientY });
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!timerRef.current || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clearTimer();
  };

  const addTag = async (tagId: string) => {
    if (!task.tags.includes(tagId)) {
      await db.tasks.update(task.id, { tags: [...task.tags, tagId] });
    }
  };

  const removeTag = async (tagId: string) => {
    await db.tasks.update(task.id, { tags: task.tags.filter((t) => t !== tagId) });
  };

  const toggleDone = () => db.tasks.update(task.id, { done: !task.done });

  return (
    <div
      draggable={!wheelOrigin}
      onDragStart={(e) => {
        clearTimer();
        e.dataTransfer.setData("text/task-id", task.id);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "select-none rounded-lg border border-border bg-surface p-3 shadow-card",
        wheelOrigin ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"
      )}
      style={{ touchAction: "none" }}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={task.done}
          onChange={toggleDone}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent"
        />
        <span className={cn("text-[13px]", task.done && "text-muted-foreground line-through")}>{task.title}</span>
      </div>
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
          {task.tags.map((tagId) => {
            const tag = tagById.get(tagId);
            if (!tag) return null;
            return (
              <TagChip key={tagId} tag={tag} onClick={() => removeTag(tagId)} className="pr-1.5" />
            );
          })}
        </div>
      )}
      <p className="mt-2 pl-6 text-[10.5px] text-muted-foreground">Maintenir pour tagger</p>

      <RadialTagPicker tags={tags} origin={wheelOrigin} onSelect={addTag} onClose={() => setWheelOrigin(null)} />
    </div>
  );
}
