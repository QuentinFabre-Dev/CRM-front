"use client";

import { Search, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useLang } from "@/lib/i18n";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-muted-foreground max-w-md">
        <Search size={15} />
        <span className="text-[13px]">Rechercher un contrôle, un client…</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLang}
          aria-label="Changer de langue"
          title={lang === "fr" ? "Basculer en anglais (texte NIST original)" : "Switch to French"}
          className="flex h-9 items-center justify-center rounded-full border border-border bg-surface px-3 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          {lang === "fr" ? "FR" : "EN"}
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Changer de thème"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition hover:text-foreground"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-background">
          JD
        </div>
      </div>
    </header>
  );
}
