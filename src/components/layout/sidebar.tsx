"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Évaluations", icon: Home },
  { href: "/referentiel", label: "Référentiel", icon: Library },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface-2">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-background">
          <ShieldCheck size={15} />
        </div>
        <span className="text-[15px] font-medium tracking-tight">Control Studio</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" || pathname.startsWith("/evaluations") : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                active ? "bg-accent-wash text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-[11px] leading-relaxed text-muted-foreground">
        Données 100% locales — rien n&apos;est envoyé à un serveur.
        <br />
        Référentiel : NIST SP 800-53 Rev 5 · CSF 2.0
      </div>
    </aside>
  );
}
