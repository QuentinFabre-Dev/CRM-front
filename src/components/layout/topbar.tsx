"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Search, Sun, Moon, Bell } from "lucide-react";
import { db } from "@/lib/db";
import { getOverdueContacts } from "@/lib/relances";
import { useTheme } from "@/components/theme-provider";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();

  const contacts = useLiveQuery(() => db.contacts.toArray(), [], []);
  const interactions = useLiveQuery(() => db.interactions.toArray(), [], []);
  const overdueCount = getOverdueContacts(contacts ?? [], interactions ?? []).length;

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border px-4 md:px-6">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-muted-foreground shadow-card max-w-md">
        <Search size={16} />
        <span className="text-[13px]">Rechercher un contact, une opportunité…</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Changer de thème"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-card transition hover:text-foreground"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-card">
          <Bell size={16} />
          {overdueCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {overdueCount}
            </span>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet text-[12px] font-semibold text-white">
          JD
        </div>
      </div>
    </header>
  );
}
