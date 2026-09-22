"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAssessment } from "@/lib/assessment";
import { db } from "@/lib/db";
import { BASELINES, type Baseline } from "@/lib/types";

const TEMPLATE_SCOPE = "__template__";

const BASELINE_HINTS: Record<Baseline, string> = {
  low: "Systèmes à faible impact — jeu de contrôles minimal.",
  moderate: "Impact modéré — le plus courant pour la majorité des systèmes.",
  high: "Fort impact — exigences renforcées (défense, santé, finance critique…).",
  privacy: "Overlay vie privée NIST SP 800-53B, en complément d'une baseline de sécurité.",
};

export function AssessmentFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [assessor, setAssessor] = useState("");
  const [scope, setScope] = useState<Baseline | typeof TEMPLATE_SCOPE>("moderate");
  const [templateId, setTemplateId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const templates = useLiveQuery(() => db.controlTemplates.orderBy("name").toArray(), [], []);
  const usingTemplate = scope === TEMPLATE_SCOPE;
  const selectedTemplate = (templates ?? []).find((t) => t.id === templateId);
  const canSubmit = Boolean(clientName.trim()) && (!usingTemplate || Boolean(selectedTemplate));

  const submit = async () => {
    if (!canSubmit) return;
    setCreating(true);
    try {
      const id = await createAssessment({
        clientName,
        assessor,
        scope: usingTemplate
          ? { kind: "template", templateId }
          : { kind: "baseline", baseline: scope as Baseline },
      });
      setOpen(false);
      setClientName("");
      setAssessor("");
      router.push(`/evaluations/${id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} /> Nouvelle évaluation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Nouvelle évaluation client</DialogTitle>
        <div className="space-y-3">
          <div>
            <Label>Nom du client / de la mission</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex. Acme Corp — Audit annuel" />
          </div>
          <div>
            <Label>Évaluateur</Label>
            <Input value={assessor} onChange={(e) => setAssessor(e.target.value)} placeholder="Votre nom" />
          </div>
          <div>
            <Label>Périmètre des contrôles</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as Baseline | typeof TEMPLATE_SCOPE)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASELINES.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    Baseline {b.label}
                  </SelectItem>
                ))}
                <SelectItem value={TEMPLATE_SCOPE}>Modèle personnalisé</SelectItem>
              </SelectContent>
            </Select>
            {!usingTemplate && (
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">{BASELINE_HINTS[scope as Baseline]}</p>
            )}
          </div>

          {usingTemplate && (
            <div>
              <Label>Modèle</Label>
              {(templates ?? []).length === 0 ? (
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Aucun modèle enregistré. Créez-en un depuis Référentiel → Modèles.
                </p>
              ) : (
                <>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un modèle…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(templates ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.controlIds.length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                      {selectedTemplate.controlIds.length} contrôle(s)
                      {selectedTemplate.description ? ` — ${selectedTemplate.description}` : ""}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <Button className="w-full" onClick={submit} disabled={!canSubmit || creating}>
            {creating ? "Création…" : "Créer l'évaluation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
