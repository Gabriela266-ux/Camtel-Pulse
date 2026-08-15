import type { CentreHierarchy, DashboardData, DailyRecord } from '../types';

export const mockHierarchyData: CentreHierarchy = {
  id: 1,
  nom: 'CPDSM 1',
  da: [
    {
      id: 101,
      nom: 'Glotelho (Master SIM 1)',
      dsm: [],
    },
    {
      id: 102,
      nom: 'Master Color (Master SIM 2)',
      dsm: [],
    },
  ],
};

export const mockDashboardInitial: DashboardData = {
  entite_id: 101,
  nom_entite: 'Glotelho (Master SIM 1)',
  kpi: {
    objectif_mensuel: 0,
    achat_cumule: 0,
    stock_securite: 0,
    ecart_jour: 0,
    ecart_cumule: 0,
    statut_alerte: 'NORMAL',
    consommation: 0,
  },
};

export const mockDailyRecords: DailyRecord[] = [];
