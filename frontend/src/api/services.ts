import type { CentreHierarchy, DashboardData } from '../types';
import { mockHierarchyData, mockDashboardInitial } from '../data/mockHierarchy';

// Mettre à true pour la démo autonome, ou false dès que le backend Express tourne
const USE_MOCK = false;

export const apiService = {
  async getHierarchie(): Promise<CentreHierarchy> {
    if (USE_MOCK) return mockHierarchyData;
    const res = await fetch('/api/hierarchie');
    return res.json();
  },

  async getDashboard(type: string, id: number): Promise<DashboardData> {
    if (USE_MOCK) return mockDashboardInitial;
    const res = await fetch(`/api/dashboard?type=${type}&id=${id}`);
    return res.json();
  },

  async postSaisie(payload: { id_pos: number; vente_jour: number }) {
    if (USE_MOCK) {
      return {
        success: true,
        message: 'Saisie enregistrée avec succès (Mock)',
        data: payload,
      };
    }
    const res = await fetch('/api/saisies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};