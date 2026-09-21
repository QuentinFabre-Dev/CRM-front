"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAssessment } from "@/lib/assessment";
import { BASELINES, type Baseline } from "@/lib/types";

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
  const [baseline, setBaseline] = useState<Baseline>("moderate");
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!clientName.trim()) return;
    setCreating(true);
    try {
      const id = await createAssessment(clientName, assessor, baseline);
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
            <Label>Baseline NIST SP 800-53B</Label>
            <Select value={baseline} onValueChange={(v) => setBaseline(v as Baseline)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASELINES.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11.5px] text-muted-foreground">{BASELINE_HINTS[baseline]}</p>
          </div>
          <Button className="w-full" onClick={submit} disabled={!clientName.trim() || creating}>
            {creating ? "Création…" : "Créer l'évaluation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
