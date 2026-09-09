import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORICAL } from "@/lib/chart-colors";

export function SourcesBreakdown({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, n]) => sum + n, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources de prospects</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Aucune donnée pour le moment.</p>
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {entries.map(([label, n], i) => (
                <div
                  key={label}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${(n / total) * 100}%`,
                    backgroundColor: CATEGORICAL[i % CATEGORICAL.length],
                    marginRight: i === entries.length - 1 ? 0 : 2,
                  }}
                  title={label}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {entries.map(([label, n], i) => (
                <li key={label} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORICAL[i % CATEGORICAL.length] }}
                    />
                    {label}
                  </span>
                  <span className="font-medium text-muted-foreground">{Math.round((n / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
