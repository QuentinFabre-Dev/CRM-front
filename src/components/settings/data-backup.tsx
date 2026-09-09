"use client";

import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { exportDatabase, importDatabase, clearDatabase, type ExportPayload } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DataBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExport = async () => {
    const payload = await exportDatabase();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexacrm-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage("Export téléchargé.");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ExportPayload;
      if (typeof payload !== "object" || !payload || !("version" in payload)) {
        throw new Error("Fichier invalide");
      }
      await importDatabase(payload);
      setMessage("Import réussi — toutes les données ont été restaurées.");
    } catch {
      setMessage("Échec de l'import : fichier JSON invalide.");
    } finally {
      e.target.value = "";
    }
  };

  const handleClear = async () => {
    await clearDatabase();
    setConfirmClear(false);
    setMessage("Toutes les données locales ont été effacées.");
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-[14px] font-semibold">Export / Import</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Toutes vos données restent dans ce navigateur. Exportez régulièrement un JSON de sauvegarde, ou pour
          transférer vos données vers un autre appareil.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleExport}>
            <Download size={14} /> Exporter en JSON
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload size={14} /> Importer un JSON
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
        </div>
        {message && <p className="mt-3 text-[12.5px] text-accent">{message}</p>}
      </Card>

      <Card className="border-danger/30 p-5">
        <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-danger">
          <AlertTriangle size={15} /> Zone de danger
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Efface définitivement toutes les données locales (contacts, opportunités, tâches, chargeabilité…).
          Exportez une sauvegarde avant si nécessaire.
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

