"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AssessmentMethod, AssessmentObjective, Control, CsfCategory, CsfFunction, CsfSubcategory, StatementPart } from "./types";

export type Lang = "fr" | "en";

interface LangContextValue {
  lang: Lang;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);
const STORAGE_KEY = "control-studio-lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "fr" || stored === "en") setLang(stored);
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === "fr" ? "en" : "fr";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const contextValue = { lang, toggleLang };
  return (
    <LangContext.Provider value={contextValue}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

// Field accessors: fall back to the official English NIST text if a French
// translation is missing for some reason, so the app never shows a blank.

export function controlTitle(c: Control, lang: Lang): string {
  return lang === "fr" ? c.titleFr || c.title : c.title;
}

export function controlFamilyTitle(c: Control, lang: Lang): string {
  return lang === "fr" ? c.familyTitleFr || c.familyTitle : c.familyTitle;
}

export function controlStatement(c: Control, lang: Lang): StatementPart[] {
  return lang === "fr" && c.statementFr ? c.statementFr : c.statement;
}

export function controlDiscussion(c: Control, lang: Lang): string {
  return lang === "fr" ? c.discussionFr || c.discussion : c.discussion;
}

export function controlObjectives(c: Control, lang: Lang): AssessmentObjective[] {
  if (lang === "fr" && c.assessmentObjectivesFr) {
    return c.assessmentObjectivesFr.map((o) => ({ id: o.id, label: o.label, text: o.textFr || o.text }));
  }
  return c.assessmentObjectives;
}

export function controlMethods(c: Control, lang: Lang): AssessmentMethod[] {
  if (lang === "fr" && c.assessmentMethodsFr) {
    return c.assessmentMethodsFr.map((m) => ({ method: m.method, objects: m.objectsFr || m.objects }));
  }
  return c.assessmentMethods;
}

export function csfFunctionTitle(f: CsfFunction, lang: Lang): string {
  return lang === "fr" ? f.titleFr || f.title : f.title;
}
export function csfFunctionText(f: CsfFunction, lang: Lang): string {
  return lang === "fr" ? f.textFr || f.text : f.text;
}
export function csfCategoryTitle(c: CsfCategory, lang: Lang): string {
  return lang === "fr" ? c.titleFr || c.title : c.title;
}
export function csfSubcategoryText(s: CsfSubcategory, lang: Lang): string {
  return lang === "fr" ? s.textFr || s.text : s.text;
}
