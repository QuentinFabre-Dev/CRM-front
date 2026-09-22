# Control Studio

Plateforme interne d'évaluation de maturité cybersécurité, basée sur **NIST SP
800-53 Rev 5** (avec les objectifs d'évaluation **SP 800-53A**), filtrée par
**baseline SP 800-53B** (Low / Moderate / High / Privacy), et mappée au
**NIST Cybersecurity Framework 2.0** via le crosswalk officiel NIST OLIR.

Remplace un suivi Excel : pour chaque mission client, l'application duplique le
sous-ensemble de contrôles de la baseline choisie, permet de vérifier chaque
objectif d'évaluation, de noter une maturité (échelle 0-5) par contrôle avec
preuves et notes, puis visualise l'ensemble agrégé par fonction/catégorie/
sous-catégorie CSF 2.0.

## Principe : zéro donnée hébergée

Comme pour les autres outils internes de ce dépôt, **aucune donnée d'évaluation
client ne transite ni n'est stockée côté serveur**. Tout vit dans le navigateur
(IndexedDB via [Dexie](https://dexie.org)). Chaque évaluation s'exporte/importe
en JSON depuis l'onglet Synthèse ou les Paramètres — c'est le mécanisme de
sauvegarde et de transfert entre appareils.

Le référentiel NIST (catalogue de contrôles, baselines, CSF 2.0 et son
crosswalk) est **embarqué en local** (`public/data/*.json`), généré une fois via
`scripts/fetch-nist-data.mjs` à partir des sources officielles NIST. L'application
ne fait **aucun appel réseau à NIST au runtime**.

## Sources de données

- Catalogue **SP 800-53 Rev 5** (objectifs d'évaluation 800-53A déjà intégrés) :
  [`usnistgov/oscal-content`](https://github.com/usnistgov/oscal-content) (OSCAL JSON, NIST officiel)
- Baselines **SP 800-53B** (Low/Moderate/High/Privacy), même dépôt, catalogues résolus
- **NIST CSF 2.0** Core + crosswalk officiel vers SP 800-53 Rev 5 (NIST OLIR) :
  API publique du NIST CSF Reference Tool (`csrc.nist.gov`)

Pour régénérer le référentiel embarqué (mise à jour NIST, nouvelle version) :

```bash
node scripts/fetch-nist-data.mjs
```

## Fonctionnalités

- **Évaluations** — liste des dossiers clients (baseline, complétude, maturité
  moyenne), création d'une nouvelle évaluation (duplique les contrôles de la
  baseline choisie ou d'un modèle personnalisé).
- **Bilingue FR/EN** — le référentiel NIST (intitulés, exigences, discussions,
  objectifs d'évaluation) est traduit en français ; bascule FR/EN dans la barre
  du haut, repli automatique sur le texte officiel anglais si une traduction
  manque.
- **Contrôles** — liste filtrable (famille, statut) avec panneau de détail :
  exigence (texte officiel, paramètres organisationnels mis en évidence),
  discussion, checklist des objectifs d'évaluation 800-53A, méthodes
  d'évaluation (EXAMINE/INTERVIEW/TEST), notation de maturité 0-5, preuves et
  notes.
- **Actifs** — périmètre raisonné par catégorie d'actifs (serveur physique, VM,
  instance infonuagique, SaaS, conteneur, poste, mobile, réseau, base de
  données, application, annuaire/IAM, stockage, site, OT/IoT), pas par machine.
  « Proposer un mapping » rattache chaque contrôle aux catégories pertinentes
  selon sa famille SP 800-53 ; le résultat s'ajuste catégorie par catégorie.
  Chaque contrôle affiche ensuite les catégories à couvrir et un indicateur de
  couverture. Les familles organisationnelles (AT, CA, IR, PL, PM, PS, RA, SR)
  restent hors périmètre d'actifs.
- **CSF 2.0** — arbre Functions → Categories → Subcategories, coloré par
  maturité moyenne des contrôles mappés (crosswalk officiel), navigation vers
  les contrôles sources.
- **Synthèse** — indicateurs clés, graphiques de maturité par famille SP 800-53
  et par fonction CSF 2.0, export Excel (.xlsx) prêt à livrer et export JSON du
  dossier complet.
- **Référentiel** — consultation libre du catalogue complet et de CSF 2.0, et
  gestion des **modèles** de contrôles personnalisés (ex. « CMA light ») :
  sélection multi-contrôles, export / import du modèle en JSON, réutilisable à
  la création d'une évaluation.
- **Paramètres** — import d'évaluation JSON, informations sur le référentiel
  embarqué, remise à zéro.

## Développement

```bash
npm install
npm run dev
```

Disponible sur http://localhost:3000.

```bash
npm run build   # build de production
npm run lint    # ESLint
```
