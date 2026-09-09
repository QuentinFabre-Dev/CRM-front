import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

export function TagChip({
  tag,
  active = true,
  onClick,
  className,
}: {
  tag: Tag;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
        active ? "border-transparent" : "border-border text-muted-foreground",
        className
      )}
      style={
        active
          ? { backgroundColor: `hsl(${tag.color} / 0.14)`, color: `hsl(${tag.color})` }
          : undefined
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `hsl(${tag.color})` }} />
      {tag.label}
    </Comp>
  );
}
