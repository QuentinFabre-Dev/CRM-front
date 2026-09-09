"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, Target as TargetIcon } from "lucide-react";
import { db } from "@/lib/db";
import { uid, type TargetType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CATEGORICAL } from "@/lib/chart-colors";

const TYPE_LABELS: Record<TargetType, string> = {
  chargeabilite: "Chargeabilité",
  vente: "Vente",
  autre: "Autre",
};

export default function ObjectifsPage() {
  const targets = useLiveQuery(() => db.targets.toArray(), [], []);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TargetType>("vente");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("%");
  const [period, setPeriod] = useState("");

  const save = async () => {
    if (!label.trim() || !value) return;
    await db.targets.add({
      id: uid(),
      type,
      label: label.trim(),
      value: Number(value),
      unit,
      period: period.trim() || "—",
      createdAt: new Date().toISOString(),
    });
    setLabel("");
    setValue("");
    setPeriod("");
    setOpen(false);
  };

  const remove = (id: string) => db.targets.delete(id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Objectifs</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Normes de chargeabilité, de vente et autres objectifs personnels.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} /> Nouvel objectif
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Nouvel objectif</DialogTitle>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TargetType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as TargetType[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {TYPE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Libellé</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Nombre de RDV / mois" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valeur cible</Label>
                  <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
                <div>
                  <Label>Unité</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, €, RDV…" />
                </div>
              </div>
              <div>
                <Label>Période</Label>
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ex. Année fiscale 2025-2026" />
              </div>
              <Button className="w-full" onClick={save}>
                Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(targets ?? []).map((target, i) => (
          <Card key={target.id} className="p-4">
            <div className="flex items-start justify-between">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${CATEGORICAL[i % CATEGORICAL.length]}1a`, color: CATEGORICAL[i % CATEGORICAL.length] }}
              >
                <TargetIcon size={16} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(target.id)}>
                <Trash2 size={14} className="text-danger" />
              </Button>
            </div>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {TYPE_LABELS[target.type]}
            </p>
            <p className="text-[14px] font-semibold">{target.label}</p>
            <p className="text-[20px] font-semibold tracking-tight">
              {target.value}
              {target.unit}
            </p>
            <p className="text-[11.5px] text-muted-foreground">{target.period}</p>
          </Card>
        ))}
        {(targets ?? []).length === 0 && (
          <p className="col-span-full text-[13px] text-muted-foreground">Aucun objectif défini pour le moment.</p>
        )}
      </div>

      <Card className="p-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle>Prochaines normes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-[13px] text-muted-foreground">
          Vos normes commerciales spécifiques pourront être ajoutées ici dès que vous les aurez transmises — même
          structure, sans refonte nécessaire.
        </CardContent>
      </Card>
    </div>
  );
}
