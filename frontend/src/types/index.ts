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
  consommation: number;
}

export interface DashboardData {
  entite_id: number;
  nom_entite: string;
  kpi: KPICardsData;
}

export interface OperationalAssignment {
  userId: number;
  nomComplet: string;
  partenaireId: number;
  partenaireNom: string;
  dsmId?: number;
  posId?: number;
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

