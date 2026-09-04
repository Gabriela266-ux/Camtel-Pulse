export interface POSNode {
  id: string;
  nom: string;
  numero_telephone?: string;
  code_pos?: string;
  code_dsm?: string;
  code_zone?: string;
  nom_reseau?: string;
}

export interface DSMNode {
  id: string;
  nom: string;
  numero_telephone?: string;
  code_dsm?: string;
  code_zone?: string;
  nom_reseau?: string;
  pos: POSNode[];
}

export interface DANode {
  id: string;
  nom: string;
  code?: string;
  region?: string;
  numero_sim?: string;
  code_zone?: string;
  nom_reseau?: string;
  dsm: DSMNode[];
}

export interface DAHierarchy {
  id: string;
  nom: string;
  da: DANode[];
}

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CHEF_OPE' | 'OPERATIONNEL';

export type EntityType = 'DA' | 'DSM' | 'POS';

export interface CalendarEntity {
  type: EntityType;
  id: string;
  label: string;
}

export type EntitySelection =
  | { type: 'DA'; id: string; nom: string }
  | { type: 'DSM'; id: string; nom: string }
  | { type: 'POS'; id: string; nom: string };

export interface KPICardsData {
  objectif_mensuel: number;
  achat_cumule: number;
  stock_securite: number;
  ecart_jour: number;
  ecart_cumule: number;
  statut_alerte: 'NORMAL' | 'CRITIQUE';
  consommation: number;
  stock_journalier_moyen_hebdo?: number;
  semaine_label?: string;
}

export interface DashboardData {
  entite_id: string;
  nom_entite: string;
  kpi: KPICardsData;
}

export interface OperationalAssignment {
  userId: string;
  nomComplet?: string;
  email?: string;
  partenaireIds: string[];
  partenaires: PartnerAssignment[];
  /** Champs historiques tolérés pendant la transition API. */
  partenaireId?: string;
  partenaireNom?: string;
  statut?: string;
  chefOperationnel?: {
    id: string;
    nomComplet: string;
    matricule: string;
  } | null;
}

export interface PartnerAssignment {
  id: string;
  nom: string;
  code?: string;
  statut?: 'actif' | 'suspendu' | string;
  affectationId?: string;
  affecteLe?: string | null;
}

export interface EntryAuthor {
  id: string;
  nomComplet?: string;
  email?: string;
  role: AppRole | 'INCONNU';
  chefOperationnel?: {
    id: string;
    nomComplet: string;
    matricule: string;
  } | null;
}

export interface EntryTraceLine {
  id: string;
  source: 'ACHAT' | 'STOCK';
  valeur: number;
  saisiLe?: string | null;
  auteurId?: string | null;
  daId?: string | null;
  dsmId?: string | null;
  posId?: string | null;
}

export interface DailyRecord {
  date: string;
  prevision_ca: number;
  achat: number;
  stock_journalier: number | null;
  cumul_achat: number;
  consommation: number | null;
  ecart_jour: number;
  ecart_cumule: number;
  statut: 'NORMAL' | 'CRITIQUE';
  saisi_par?: EntryAuthor | null;
  saisie_auteurs?: EntryAuthor[];
  saisie_details?: {
    entityType: EntityType;
    entityId: string;
    lignes: EntryTraceLine[];
  };
}
export interface Operationnel {
  id: string;
  nom_complet?: string;
  email?: string;
  role?: string;
  statut?: 'actif' | 'suspendu' | 'inactif';
  partenaireIds?: string[];
  partenaires?: PartnerAssignment[];
  partenaireId?: string;
  chefOperationnel?: {
    id: string;
    nomComplet: string;
    matricule: string;
  } | null;
}

export interface AddPartnerPayload {
  nom: string;
  masterSim: string;
  region: string;
  codeZone: string;
}

export interface CreateDsmPayload {
  da_id: string;
  nom: string;
  numero_telephone: string;
  code_dsm: string;
  code_zone: string;
}

export interface CreatePosPayload {
  dsm_id: string;
  numero_telephone: string;
  code_pos: string;
}
