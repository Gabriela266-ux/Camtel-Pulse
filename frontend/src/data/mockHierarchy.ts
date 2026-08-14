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
    objectif_mensuel: 1550000,
    realise_cumule: 350000,
    stock_securite: 150000,
    ecart_jour: -15000,
    ecart_cumule: -25000,
    statut_alerte: 'CRITIQUE',
    consommation: 1425000,
  },
};

export const mockDailyRecords: DailyRecord[] = [];
