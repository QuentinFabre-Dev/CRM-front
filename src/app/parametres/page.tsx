import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagManager } from "@/components/settings/tag-manager";
import { DataBackup } from "@/components/settings/data-backup";

export default function ParametresPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Données 100% locales — rien n&apos;est jamais envoyé à un serveur.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagManager />
        </CardContent>
      </Card>

      <DataBackup />
    </div>
  );
}
