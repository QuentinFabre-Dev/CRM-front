"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  Grid2x2,
  Clock,
  Target,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/opportunites", label: "Opportunités", icon: Briefcase },
  { href: "/taches", label: "Tâches", icon: Grid2x2 },
  { href: "/chargeabilite", label: "Chargeabilité", icon: Clock },
  { href: "/objectifs", label: "Objectifs", icon: Target },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface-2/60">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <ShieldCheck size={18} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">NexaCRM</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 text-[11px] text-muted-foreground">
        Données 100% locales — rien n&apos;est envoyé à un serveur.
      </div>
    </aside>
  );
}
