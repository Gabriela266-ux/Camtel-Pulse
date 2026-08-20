import type { CentreHierarchy, DashboardData, EntityType } from '../types';
import type { AddPartnerPayload, OperationalAssignment, Operationnel } from '../types';
import type { User } from '../auth/AuthContext';

const API_TIMEOUT = 30000;
const TOKEN_KEY = 'cp_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function buildHeaders(withAuth = true): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Délai dépassé après ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Toutes les routes protégées du backend renvoient { ok: boolean, data?, message? }
async function request<T>(path: string, options: RequestInit = {}, withAuth = true, timeout?: number): Promise<T> {
  const res = await fetchWithTimeout(
    `/api${path}`,
    { ...options, headers: { ...buildHeaders(withAuth), ...(options.headers || {}) } },
    timeout,
  );

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // réponse vide
  }

  if (!res.ok || (json && json.ok === false)) {
    throw new ApiError(json?.message || `Erreur ${res.status}`, res.status);
  }

  return (json?.data ?? json) as T;
}

export interface LoginResult {
  token: string;
  user: User;
}

// Rôles backend (table role, normalisés en snake_case par authRoutes.js)
// -> rôles frontend (les 4 rôles fixés par l'encadreur).
function mapBackendRole(role: string): User['role'] {
  const map: Record<string, User['role']> = {
    admin: 'ADMIN',
    chef_operationnel: 'CHEF_OPE',
    manager: 'MANAGER',
    operationnel: 'OPERATIONNEL',
  };
  return map[role] || 'OPERATIONNEL';
}

export const apiService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const raw = await request<{ token: string; user: any }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
    );

    return {
      token: raw.token,
      user: {
        id: String(raw.user.id),
        nom_complet: raw.user.name,
        email: raw.user.email,
        role: mapBackendRole(raw.user.role),
        partenaireId: raw.user.da_id ? String(raw.user.da_id) : undefined,
      },
    };
  },

  async getHierarchie(): Promise<CentreHierarchy> {
    return request<CentreHierarchy>('/hierarchie');
  },

  async getDashboard(type: EntityType, id: string): Promise<DashboardData> {
    return request<DashboardData>(`/dashboard?type=${type}&id=${encodeURIComponent(id)}`);
  },

  async postSaisie(payload: { id_pos: string; date: string; vente_jour: number; stock_journalier?: number }) {
    return request('/saisies', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Historique journalier réel (Suivi journalier) pour une entité et un mois donnés.
  async getRecords(type: EntityType, id: string, month?: string): Promise<any[]> {
    const monthParam = month ? `&month=${encodeURIComponent(month)}` : '';
    return request(`/dashboard/records?type=${type}&id=${encodeURIComponent(id)}${monthParam}`);
  },

  // Persiste réellement l'objectif mensuel (DA : colonne objectif_mensuel ;
  // DSM/POS : ligne du mois courant dans objectif_mensuel).
  async updateObjective(type: EntityType, id: string, objectif_mensuel: number) {
    return request(`/objectifs/${type.toLowerCase()}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ objectif_mensuel }),
    });
  },

  // Calendrier d'Achat (jargon Camtel pour "prévisions") : lecture et sauvegarde réelles.
  async getCalendrierAchat(id_pos: string, year: number, month: number): Promise<Record<string, number>> {
    return request(`/calendrier-achat?id_pos=${encodeURIComponent(id_pos)}&year=${year}&month=${month}`);
  },

  async saveCalendrierAchat(id_pos: string, forecasts: Record<string, number>) {
    return request('/calendrier-achat', {
      method: 'POST',
      body: JSON.stringify({ id_pos, forecasts }),
    });
  },

  async importCsv(csvContent: string): Promise<any> {
    return request(
      '/import/csv',
      { method: 'POST', body: JSON.stringify({ content: csvContent }) },
      true,
      60000,
    );
  },

  // --- Opérationnels & affectations (à implémenter côté backend) ---
  async getOperationnels(): Promise<Operationnel[]> {
    return request<Operationnel[]>('/operationnels');
  },

  async getAffectations(): Promise<OperationalAssignment[]> {
    return request<OperationalAssignment[]>('/affectations');
  },

  async creerPartenaire(payload: AddPartnerPayload): Promise<{ id: string; nom: string }> {
    return request<{ id: string; nom: string }>('/partenaires', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
