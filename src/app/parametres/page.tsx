"use client";

import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AlertTriangle, Upload } from "lucide-react";
import { db, importAssessment, type AssessmentExportPayload } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParametresPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const controlCount = useLiveQuery(() => db.controls.count(), [], 0);
  const subcategoryCount = useLiveQuery(() => db.csfSubcategories.count(), [], 0);
  const mappingCount = useLiveQuery(() => db.csfMappings.count(), [], 0);
  const assessmentCount = useLiveQuery(() => db.assessments.count(), [], 0);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as AssessmentExportPayload;
      if (!payload?.assessment?.id) throw new Error("Fichier invalide");
      await importAssessment(payload);
      setMessage(`Évaluation « ${payload.assessment.clientName} » importée.`);
    } catch {
      setMessage("Échec de l'import : fichier JSON invalide.");
    } finally {
      e.target.value = "";
    }
  };

  const handleClear = async () => {
    await db.transaction(
      "rw",
      [db.assessments, db.assessmentControls, db.controls, db.csfFunctions, db.csfCategories, db.csfSubcategories, db.csfMappings],
      async () => {
        await Promise.all([
          db.assessments.clear(),
          db.assessmentControls.clear(),
          db.controls.clear(),
          db.csfFunctions.clear(),
          db.csfCategories.clear(),
          db.csfSubcategories.clear(),
          db.csfMappings.clear(),
        ]);
      }
    );
    setConfirmClear(false);
    setMessage("Toutes les données locales ont été effacées. Rechargez la page pour recharger le référentiel.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight">Paramètres</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Données 100% locales — rien n&apos;est jamais envoyé à un serveur.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Référentiel embarqué</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Contrôles SP 800-53</p>
            <p className="text-[18px] font-medium">{controlCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Sous-catégories CSF 2.0</p>
            <p className="text-[18px] font-medium">{subcategoryCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Mappings CSF ↔ 800-53</p>
            <p className="text-[18px] font-medium">{mappingCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Évaluations</p>
            <p className="text-[18px] font-medium">{assessmentCount}</p>
          </div>
        </CardContent>
        <CardContent className="pt-0 text-[12px] text-muted-foreground">
          Catalogue NIST SP 800-53 Rev 5 (avec objectifs d&apos;évaluation 800-53A), baselines SP 800-53B, et
          crosswalk officiel NIST OLIR vers CSF 2.0 — embarqués dans l&apos;application, aucun appel réseau au runtime.
        </CardContent>
      </Card>

      <Card className="p-5">
        <h3 className="text-[14px] font-medium">Importer une évaluation</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Importez un fichier JSON exporté depuis l&apos;onglet Synthèse d&apos;une évaluation (sauvegarde ou transfert
          vers un autre appareil).
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={handleImportClick}>
            <Upload size={14} /> Importer un JSON
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
        </div>
        {message && <p className="mt-3 text-[12.5px] text-accent">{message}</p>}
      </Card>

      <Card className="border-danger/30 p-5">
        <h3 className="flex items-center gap-1.5 text-[14px] font-medium text-danger">
          <AlertTriangle size={15} /> Zone de danger
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Efface définitivement toutes les évaluations et le référentiel local. Exportez vos dossiers avant si
          nécessaire (onglet Synthèse de chaque évaluation).
        </p>
        {confirmClear ? (
          <div className="mt-3 flex gap-2">
            <Button variant="danger" onClick={handleClear}>
              Confirmer la suppression
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button variant="danger" className="mt-3" onClick={() => setConfirmClear(true)}>
            Effacer toutes les données
          </Button>
        )}
      </Card>
    </div>
  );
}
