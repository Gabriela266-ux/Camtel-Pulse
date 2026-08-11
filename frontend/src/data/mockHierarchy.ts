import type { CentreHierarchy, DashboardData } from '../types';

export const mockHierarchyData: CentreHierarchy = {
  id: 1,
  nom: 'Centre 1 CDPSM (Littoral)',
  da: [
    {
      id: 101,
      nom: 'Glotelho (Master SIM 1)',
      dsm: [
        {
          id: 201,
          nom: 'DSM 1 - Akwa',
          pos: [
            { id: 301, nom: 'POS 274 Akwa Boulevard' },
            { id: 302, nom: 'POS 275 Akwa Centre' },
          ],
        },
      ],
    },
    {
      id: 102,
      nom: 'Master Color (Master SIM 2)',
      dsm: [
        {
          id: 202,
          nom: 'DSM 2 - Bonanjo',
          pos: [{ id: 303, nom: 'POS 108 Bonanjo Port' }],
        },
      ],
    },
  ],
};

export const mockDashboardInitial: DashboardData = {
  entite_id: 301,
  nom_entite: 'POS 274 Akwa Boulevard',
  kpi: {
    objectif_mensuel: 1550000,
    realise_cumule: 350000,
    stock_securite: 150000,
    ecart_jour: -15000,
    ecart_cumule: -25000,
    statut_alerte: 'CRITIQUE',
  },
};