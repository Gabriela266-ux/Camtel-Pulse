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
      nom: 'Masters colo (Master SIM 2)',
      dsm: [
        {
          id: 202,
          nom: 'DSM 2 - Bonanjo',
          pos: [
            { id: 303, nom: 'POS 108 Bonanjo Port' },
            { id: 304, nom: 'POS 109 Bonanjo Central' },
            { id: 305, nom: 'POS 110 Bonanjo Molyko' },
          ],
        },
        {
          id: 203,
          nom: 'DSM 3 - Goudronnage Partners',
          pos: [
            { id: 306, nom: 'Partner POS 1 - OBC' },
            { id: 307, nom: 'Partner POS 2 - ICG' },
          ],
        },
      ],
    },
  ],
};

export const mockDashboardInitial: DashboardData = {
  entite_id: 301,
  nom_entite: 'POS 274 Akwa Boulevard',
  entite_type: 'POS',
  breadcrumb: 'Centre 1 CDPSM (Littoral) / Glotelho (Master SIM 1) / DSM 1 - Akwa / POS 274 Akwa Boulevard',
  kpi: {
    objectif_mensuel: 1550000,
    realise_cumule: 350000,
    stock_securite: 150000,
    ecart_jour: -15000,
    ecart_cumule: -25000,
    statut_alerte: 'CRITIQUE',
  },
};