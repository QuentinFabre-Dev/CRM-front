"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { seedReferenceData } from "@/lib/seed";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seedReferenceData()
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setReady(true));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <p className="max-w-sm text-[13px] text-danger">{error}</p>
      </div>
    );
  }

  return <ThemeProvider>{ready ? children : <div className="min-h-screen bg-background" />}</ThemeProvider>;
}
