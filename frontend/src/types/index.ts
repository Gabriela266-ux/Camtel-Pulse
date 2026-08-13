export interface POSNode {
  id: number;
  nom: string;
}

export interface DSMNode {
  id: number;
  nom: string;
  pos: POSNode[];
}

export interface DANode {
  id: number;
  nom: string;
  dsm: DSMNode[];
}

export interface CentreHierarchy {
  id: number;
  nom: string;
  da: DANode[];
}

export type AppRole = 'ADMIN' | 'MANAGER' | 'CHEF_OPE' | 'OPERATIONNEL';

export type EntitySelection =
  | { type: 'CENTRE'; id: number; nom: string }
  | { type: 'DA'; id: number; nom: string }
  | { type: 'DSM'; id: number; nom: string }
  | { type: 'POS'; id: number; nom: string };

export interface KPICardsData {
  objectif_mensuel: number;
  realise_cumule: number;
  stock_securite: number;
  ecart_jour: number;
  ecart_cumule: number;
  statut_alerte: 'NORMAL' | 'CRITIQUE';
}

export interface DashboardData {
  entite_id: number;
  nom_entite: string;
  kpi: KPICardsData;
}

export interface DailyRecord {
  date: string;
  prevision_ca: number;
  stock_journalier: number;
  realisation_va: number;
  cumul_achat: number;
  ecart_stock_sec: number;
  ecart_jour: number;
  ecart_cumule: number;
  statut: 'NORMAL' | 'CRITIQUE';
}

