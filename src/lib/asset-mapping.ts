/**
 * Catalogue de catégories d'actifs et proposition de mapping vers les familles
 * SP 800-53. Le mapping est un point de départ défendable, pas une vérité :
 * il s'ajuste par groupe depuis l'onglet Actifs.
 */

export interface AssetGroupTemplate {
  key: string;
  name: string;
  description: string;
}

export const DEFAULT_ASSET_GROUPS: AssetGroupTemplate[] = [
  { key: "serveur-physique", name: "Serveur physique", description: "Serveurs bare-metal, en local ou en colocation" },
  { key: "serveur-vm", name: "Serveur virtuel (VM)", description: "Machines virtuelles et hyperviseurs" },
  { key: "cloud", name: "Instance infonuagique", description: "Instances et services managés IaaS / PaaS" },
  { key: "saas", name: "Service SaaS", description: "Applications tierces consommées en mode service" },
  { key: "conteneur", name: "Conteneur et orchestrateur", description: "Images, registres et clusters Kubernetes" },
  { key: "poste-travail", name: "Poste de travail", description: "Postes fixes et portables des collaborateurs" },
  { key: "mobile", name: "Appareil mobile", description: "Téléphones et tablettes, flotte gérée ou BYOD" },
  { key: "reseau", name: "Équipement réseau", description: "Pare-feu, commutateurs, routeurs, VPN, points d'accès" },
  { key: "bdd", name: "Base de données", description: "Instances de bases de données et entrepôts de données" },
  { key: "application", name: "Application métier", description: "Applications développées ou intégrées en interne" },
  { key: "annuaire", name: "Annuaire et IAM", description: "Annuaires, fédération d'identité, accès à privilèges" },
  { key: "stockage", name: "Stockage et sauvegarde", description: "Baies, partages, sauvegardes, supports amovibles" },
  { key: "site", name: "Site et local technique", description: "Sites, salles serveurs, centres de données" },
  { key: "ot-iot", name: "OT / IoT", description: "Systèmes industriels, automates, objets connectés" },
];

const TECHNIQUE_COMPLET = [
  "serveur-physique",
  "serveur-vm",
  "cloud",
  "saas",
  "conteneur",
  "poste-travail",
  "mobile",
  "reseau",
  "bdd",
  "application",
  "annuaire",
];

/**
 * Familles absentes de cette table (AT, CA, IR, PL, PM, PS, RA, SR) : contrôles
 * organisationnels, sans périmètre d'actifs — aucune couverture n'est demandée.
 */
export const FAMILY_ASSET_MAP: Record<string, string[]> = {
  ac: TECHNIQUE_COMPLET,
  ia: TECHNIQUE_COMPLET,
  au: ["serveur-physique", "serveur-vm", "cloud", "saas", "conteneur", "reseau", "bdd", "application", "annuaire"],
  cm: ["serveur-physique", "serveur-vm", "cloud", "conteneur", "poste-travail", "mobile", "reseau", "bdd", "application"],
  sc: ["serveur-physique", "serveur-vm", "cloud", "saas", "conteneur", "poste-travail", "mobile", "reseau", "bdd", "application"],
  si: ["serveur-physique", "serveur-vm", "cloud", "saas", "conteneur", "poste-travail", "mobile", "reseau", "bdd", "application"],
  cp: ["serveur-physique", "serveur-vm", "cloud", "bdd", "application", "stockage", "site"],
  ma: ["serveur-physique", "reseau", "poste-travail", "site", "ot-iot"],
  mp: ["stockage", "poste-travail", "mobile", "site"],
  pe: ["serveur-physique", "reseau", "site", "ot-iot"],
  pt: ["cloud", "saas", "bdd", "application"],
  sa: ["cloud", "saas", "conteneur", "application"],
};

export function defaultGroupKeysForFamily(family: string): string[] {
  return FAMILY_ASSET_MAP[family.toLowerCase()] ?? [];
}
