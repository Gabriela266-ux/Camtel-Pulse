export interface POSNode {
  id: string;
  nom: string;
}

export interface DSMNode {
  id: string;
  nom: string;
  pos: POSNode[];
}

export interface DANode {
  id: string;
  nom: string;
  dsm: DSMNode[];
}

export interface CentreHierarchy {
  id: string;
  nom: string;
  da: DANode[];
}

export type AppRole = 'ADMIN' | 'MANAGER' | 'CHEF_OPE' | 'OPERATIONNEL';

export type EntityType = 'CENTRE' | 'DA' | 'DSM' | 'POS';

export type EntitySelection =
  | { type: 'CENTRE'; id: string; nom: string }
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
}

export interface DashboardData {
  entite_id: string;
  nom_entite: string;
  kpi: KPICardsData;
}

export interface OperationalAssignment {
  userId: number;
  nomComplet: string;
  partenaireId: string;
  partenaireNom: string;
  dsmId?: string;
  posId?: string;
}

export interface DailyRecord {
  date: string;
  prevision_ca: number;
  achat: number;
  stock_journalier: number;
  cumul_achat: number;
  consommation: number | null;
  ecart_jour: number;
  ecart_cumule: number;
  statut: 'NORMAL' | 'CRITIQUE';
}

