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

