"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { seedIfEmpty } from "@/lib/seed";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true));
  }, []);

  return (
    <ThemeProvider>
      {ready ? children : <div className="min-h-screen bg-background" />}
    </ThemeProvider>
  );
}
