# NexaCRM

Mini CRM interne, local-first : opportunités commerciales, carnet de contacts avec
relances, matrice d'Eisenhower et suivi de chargeabilité.

## Principe : zéro donnée hébergée

L'application peut être déployée en ligne (Vercel ou équivalent) pour être
accessible depuis une URL, mais **aucune donnée métier ne transite ni n'est
stockée côté serveur**. Contacts, opportunités, tâches, interactions et
saisies de chargeabilité vivent uniquement dans le navigateur (IndexedDB, via
[Dexie](https://dexie.org)). Aucune base de données, aucune API applicative.

- Usage mono-appareil : les données restent dans le navigateur qui les a créées.
- Sauvegarde/transfert : export et import JSON complets depuis **Paramètres**.
- Au premier lancement sans données, un jeu de données de démonstration est
  généré automatiquement (voir `src/lib/seed.ts`).

## Stack

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS + composants Radix (style inspiré d'Apple HIG)
- [Dexie](https://dexie.org) / IndexedDB pour le stockage local
- Recharts pour les graphiques, Framer Motion pour les animations

## Fonctionnalités

- **Accueil** — KPI, pipeline par étape, sources de prospects, chargeabilité,
  relances en retard, tâches du jour, activité récente.
- **Contacts** — fiche détaillée avec fil chronologique d'interactions
  (appels, emails, lunchs, notes, réunions) et badge de relance après 60
  jours sans contact.
- **Opportunités** — vue Kanban par étape, liée aux contacts.
- **Tâches** — matrice d'Eisenhower en glisser-déposer ; un clic maintenu sur
  une tâche ouvre une roue radiale pour lui poser un tag libre.
- **Chargeabilité** — saisie hebdomadaire, cumul sur l'année fiscale
  (1 oct → 30 sept) et suivi de l'objectif (80% par défaut).
- **Objectifs** — normes personnelles (chargeabilité, vente, autres),
  librement extensibles.
- **Paramètres** — gestion des tags, export/import JSON, remise à zéro.

## Développement

```bash
npm install
npm run dev
```

L'application est disponible sur http://localhost:3000.

```bash
npm run build   # build de production
npm run lint    # ESLint
```
