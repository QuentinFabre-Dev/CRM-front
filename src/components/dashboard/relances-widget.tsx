import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS } from "@/lib/chart-colors";
import type { OverdueContact } from "@/lib/relances";

export function RelancesWidget({ overdue }: { overdue: OverdueContact[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relances à faire</CardTitle>
        <Link href="/contacts" className="text-[12px] text-accent hover:underline">
          Voir tout
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {overdue.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Aucune relance en retard. 👍</p>
        ) : (
          overdue.slice(0, 5).map(({ contact, daysSince }) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="flex items-center justify-between rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={14} style={{ color: STATUS.critical }} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{contact.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">{contact.company}</p>
                </div>
              </div>
              <span className="shrink-0 text-[11.5px] font-medium" style={{ color: STATUS.critical }}>
                {daysSince}j
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
