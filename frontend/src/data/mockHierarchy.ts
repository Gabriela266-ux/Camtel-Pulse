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
  },
};

export const mockDailyRecords: DailyRecord[] = [
  { date: '2026-08-04', prevision_ca: 850, stock_journalier: 390, realisation_va: 810, cumul_achat: 3400, ecart_stock_sec: 390, ecart_jour: -40, ecart_cumule: 0, statut: 'CRITIQUE' },
  { date: '2026-08-05', prevision_ca: 850, stock_journalier: 430, realisation_va: 950, cumul_achat: 4350, ecart_stock_sec: 430, ecart_jour: 100, ecart_cumule: 100, statut: 'NORMAL' },
  { date: '2026-08-06', prevision_ca: 850, stock_journalier: 540, realisation_va: 720, cumul_achat: 5070, ecart_stock_sec: 540, ecart_jour: -130, ecart_cumule: -30, statut: 'CRITIQUE' },
  { date: '2026-08-07', prevision_ca: 850, stock_journalier: 415, realisation_va: 890, cumul_achat: 5960, ecart_stock_sec: 415, ecart_jour: 40, ecart_cumule: 10, statut: 'NORMAL' },
  { date: '2026-08-08', prevision_ca: 850, stock_journalier: 405, realisation_va: 875, cumul_achat: 6835, ecart_stock_sec: 405, ecart_jour: 25, ecart_cumule: 35, statut: 'NORMAL' },
  { date: '2026-08-09', prevision_ca: 850, stock_journalier: 540, realisation_va: 760, cumul_achat: 7595, ecart_stock_sec: 540, ecart_jour: -90, ecart_cumule: -55, statut: 'CRITIQUE' },
  { date: '2026-08-10', prevision_ca: 850, stock_journalier: 425, realisation_va: 910, cumul_achat: 8505, ecart_stock_sec: 425, ecart_jour: 60, ecart_cumule: 5, statut: 'NORMAL' },
  { date: '2026-08-11', prevision_ca: 850, stock_journalier: 290, realisation_va: 640, cumul_achat: 9145, ecart_stock_sec: 290, ecart_jour: -210, ecart_cumule: -205, statut: 'CRITIQUE' },
];
