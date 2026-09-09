"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { STAGES, type Opportunity, type OpportunityStage } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { ORDINAL_BLUE, STATUS } from "@/lib/chart-colors";
import { OpportunityFormDialog } from "@/components/opportunities/opportunity-form-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function OpportunitesPage() {
  const opportunities = useLiveQuery(() => db.opportunities.toArray(), [], []);
  const contacts = useLiveQuery(() => db.contacts.toArray(), [], []);
  const contactById = new Map((contacts ?? []).map((c) => [c.id, c]));
  const [dragOverStage, setDragOverStage] = useState<OpportunityStage | null>(null);

  const moveTo = async (id: string, stage: OpportunityStage) => {
    await db.opportunities.update(id, { stage, updatedAt: new Date().toISOString() });
  };

  const setOutcome = async (id: string, outcome: "won" | "lost") => {
    await db.opportunities.update(id, { outcome, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Opportunités</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{(opportunities ?? []).length} opportunité(s)</p>
        </div>
        <OpportunityFormDialog />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage, stageIndex) => {
          const items = (opportunities ?? []).filter((o) => o.stage === stage.id);
          const total = items.reduce((sum, o) => sum + o.amount, 0);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.id);
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/opportunity-id");
                if (id) moveTo(id, stage.id);
                setDragOverStage(null);
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-surface-2/60 p-3 transition-colors",
                dragOverStage === stage.id && "border-accent bg-accent/5"
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ORDINAL_BLUE[stageIndex] }} />
                  <span className="text-[12.5px] font-semibold">{stage.title}</span>
                  <span className="text-[11px] text-muted-foreground">({items.length})</span>
                </div>
              </div>
              <p className="mb-2 px-1 text-[11.5px] text-muted-foreground">{formatCurrency(total)}</p>
              <div className="space-y-2">
                {items.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opp={opp}
                    contactName={contactById.get(opp.contactId)?.name}
                    contactCompany={contactById.get(opp.contactId)?.company}
                    onSetOutcome={setOutcome}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpportunityCard({
  opp,
  contactName,
  contactCompany,
  onSetOutcome,
}: {
  opp: Opportunity;
  contactName?: string;
  contactCompany?: string;
  onSetOutcome: (id: string, outcome: "won" | "lost") => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/opportunity-id", opp.id)}
      className="cursor-grab rounded-lg border border-border bg-surface p-3 shadow-card active:cursor-grabbing"
    >
      <OpportunityFormDialog
        opportunity={opp}
        trigger={
          <div className="cursor-pointer">
            <p className="text-[13px] font-medium leading-tight">{opp.title}</p>
            {(contactName || contactCompany) && (
              <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
                {contactName} · {contactCompany}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold">{formatCurrency(opp.amount)}</span>
              {opp.source && (
                <Badge variant="outline" className="text-[10px]">
                  {opp.source}
                </Badge>
              )}
            </div>
          </div>
        }
      />
      {opp.stage === "ferme" && (
        <div className="mt-2 border-t border-border pt-2" onClick={(e) => e.stopPropagation()}>
          {opp.outcome === "open" ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => onSetOutcome(opp.id, "won")}
                className="flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium"
                style={{ color: STATUS.good, backgroundColor: `${STATUS.good}1a` }}
              >
                <Check size={11} /> Gagné
              </button>
              <button
                onClick={() => onSetOutcome(opp.id, "lost")}
                className="flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium"
                style={{ color: STATUS.critical, backgroundColor: `${STATUS.critical}1a` }}
              >
                <X size={11} /> Perdu
              </button>
            </div>
          ) : (
            <Badge variant={opp.outcome === "won" ? "success" : "danger"}>
              {opp.outcome === "won" ? "Gagné" : "Perdu"}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
