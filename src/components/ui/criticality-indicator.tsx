import { SignalHigh, SignalMedium, SignalLow } from "lucide-react";
import { RISK_CRITICALITY_LABELS, type RiskCriticality } from "@/lib/types";
import { cn } from "@/lib/utils";

// Intensité d'un seul ton (accent) plutôt que la palette rouge/orange/vert de
// la maturité : deux axes différents (priorité de l'exigence vs score atteint)
// ne doivent jamais partager le même code couleur dans la même vue.
const ICONS: Record<RiskCriticality, typeof SignalHigh> = {
  high: SignalHigh,
  medium: SignalMedium,
  low: SignalLow,
};

const STYLES: Record<RiskCriticality, string> = {
  high: "text-accent",
  medium: "text-accent/55",
  low: "text-muted-foreground/45",
};

export function CriticalityIndicator({ level, className }: { level?: RiskCriticality; className?: string }) {
  if (!level) return null;
  const Icon = ICONS[level];
  return (
    <span
      title={`Priorité de remédiation (estimation indicative, hors référentiel officiel NIST) : ${RISK_CRITICALITY_LABELS[level]}`}
      className={cn("mt-0.5 inline-flex shrink-0 items-center", STYLES[level], className)}
    >
      <Icon size={13} strokeWidth={2.4} />
    </span>
  );
}

export function CriticalityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
      <span className="text-muted-foreground/70">Priorité de remédiation (estimation) :</span>
      {(Object.keys(RISK_CRITICALITY_LABELS) as RiskCriticality[]).map((level) => (
        <span key={level} className="inline-flex items-center gap-1">
          <CriticalityIndicator level={level} className="mt-0" />
          {RISK_CRITICALITY_LABELS[level]}
        </span>
      ))}
    </div>
  );
}
