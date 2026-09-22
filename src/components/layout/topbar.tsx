"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search, Settings, ShieldCheck, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Évaluations", icon: Home },
  { href: "/referentiel", label: "Référentiel", icon: Library },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-background">
          <ShieldCheck size={15} />
        </div>
        <span className="hidden text-[15px] font-medium tracking-tight sm:inline">Control Studio</span>
      </Link>

      <nav className="hidden items-center gap-0.5 md:flex">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" || pathname.startsWith("/evaluations") : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active ? "bg-accent-wash text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-muted-foreground lg:flex">
        <Search size={15} />
        <span className="text-[13px]">Rechercher un contrôle, un client…</span>
      </div>
      <div className="flex-1 lg:hidden" />

      <div className="flex shrink-0 items-center gap-2">
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
