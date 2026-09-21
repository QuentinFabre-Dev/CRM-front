import { MATURITY_LEVELS } from "@/lib/types";
import { maturityColor } from "@/lib/maturity";
import { cn } from "@/lib/utils";

export function MaturityPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (score: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {MATURITY_LEVELS.map((level) => {
        const active = value === level.score;
        const color = maturityColor(level.score);
        return (
          <button
            key={level.score}
            type="button"
            onClick={() => onChange(level.score)}
            title={level.description}
            aria-label={`Maturité ${level.score} — ${level.label}`}
            className={cn(
              "flex flex-col items-center gap-1 rounded-sm border px-2 py-2 text-center transition-colors",
              active ? "border-transparent" : "border-border hover:bg-muted"
            )}
            style={active ? { backgroundColor: `${color}1f`, borderColor: color } : undefined}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {level.score}
            </span>
            <span className="text-[10.5px] font-medium leading-tight">{level.label}</span>
          </button>
        );
      })}
    </div>
  );
}
