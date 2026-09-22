import type { StatementPart } from "@/lib/types";

export function StatementView({ parts, depth = 0 }: { parts: StatementPart[]; depth?: number }) {
  return (
    <ol className={depth === 0 ? "space-y-2" : "mt-1.5 space-y-1.5"} style={{ paddingLeft: depth > 0 ? 18 : 0 }}>
      {parts.map((part, i) => (
        <li key={i} className="text-[13px] leading-relaxed">
          {part.label && <span className="mr-1.5 font-medium text-muted-foreground">{part.label}</span>}
          <span>{part.prose}</span>
          {part.parts && part.parts.length > 0 && <StatementView parts={part.parts} depth={depth + 1} />}
        </li>
      ))}
    </ol>
  );
}
