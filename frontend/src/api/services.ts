import type { CalendarEntity, DAHierarchy, DashboardData, EntityType } from '../types';
import type {
  AddPartnerPayload,
  CreateDsmPayload,
  CreatePosPayload,
  OperationalAssignment,
  Operationnel,
} from '../types';
import type { DailyRecord } from '../types';
import type { User } from '../auth/authState';

const API_TIMEOUT = 30000;
const TOKEN_KEY = 'cp_token';

export interface CalendarSaveRow {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  date: string;
  montant: number;
  volume: number;
}

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

function normalizeHierarchy(value: Partial<DAHierarchy> | null | undefined): DAHierarchy {
  const centre = value || {};
  const das = Array.isArray(centre.da) ? centre.da : [];

  return {
    id: String(centre.id || ''),
    nom: String(centre.nom || ''),
    da: das.map((da) => ({
      ...da,
      id: String(da.id),
      nom: String(da.nom || ''),
      code: da.code ? String(da.code) : undefined,
      region: da.region ? String(da.region) : undefined,
      numero_sim: da.numero_sim ? String(da.numero_sim) : undefined,
      code_zone: da.code_zone ? String(da.code_zone) : undefined,
      nom_reseau: da.nom_reseau ? String(da.nom_reseau) : undefined,
      dsm: (Array.isArray(da.dsm) ? da.dsm : []).map((dsm) => ({
        ...dsm,
        id: String(dsm.id),
        nom: String(dsm.nom || ''),
        numero_telephone: dsm.numero_telephone ? String(dsm.numero_telephone) : undefined,
        code_dsm: dsm.code_dsm ? String(dsm.code_dsm) : undefined,
        code_zone: dsm.code_zone ? String(dsm.code_zone) : undefined,
        nom_reseau: dsm.nom_reseau ? String(dsm.nom_reseau) : undefined,
        pos: (Array.isArray(dsm.pos) ? dsm.pos : []).map((pos) => ({
          ...pos,
          id: String(pos.id),
          nom: String(pos.nom || ''),
          numero_telephone: pos.numero_telephone ? String(pos.numero_telephone) : undefined,
          code_pos: pos.code_pos ? String(pos.code_pos) : undefined,
          code_dsm: pos.code_dsm ? String(pos.code_dsm) : undefined,
          code_zone: pos.code_zone ? String(pos.code_zone) : undefined,
          nom_reseau: pos.nom_reseau ? String(pos.nom_reseau) : undefined,
        })),
      })),
    })),
  };
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
    // Token invalide ou expiré : purge locale et retour à la connexion,
    // sauf pour les requêtes publiques (login…).
    if (res.status === 401 && withAuth) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    throw new ApiError(json?.message || `Erreur ${res.status}`, res.status);
  }

  return (json?.data ?? json) as T;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface AccountDecisionResult {
  id?: string;
  nom_complet?: string;
  email?: string;
  matricule?: string;
  temporaryPassword?: string;
  emailNotification?: { sent?: boolean };
  message?: string;
}

export interface AdminAccountPayload {
  nom_complet: string;
  email: string;
  matricule: string;
  telephone?: string;
  role_id: string;
  chef_operationnel_id?: string;
}

export interface AccessRequestPayload {
  name: string;
  role_id: string;
  matricule: string;
  email: string;
  telephone: string;
  dateDemande: string;
  centre_id: string;
  chef_operationnel_id?: string;
}

export interface RequestRole {
  id: string;
  libelle: string;
}

export interface PublicCentre {
  id: string;
  code_centre: string;
  nom_centre: string;
  region: string;
}

export interface PublicChefOperationnel {
  id: string;
  nom_complet: string;
  matricule: string;
}

export interface CentreRecord extends PublicCentre {
  telephone: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  counts: { users: number; partners: number; dsms: number; pos: number };
}

export interface SuperAdminOverview {
  activeCentres: number;
  admins: number;
  users: number;
  pendingRequests: number;
  suspendedAccounts: number;
}

export interface AdminRecord {
  id: string;
  nom_complet: string;
  email: string;
  matricule: string;
  telephone?: string | null;
  statut: string;
  centre_id: string;
  centre?: PublicCentre;
}

export interface CreateCentrePayload {
  nom_centre: string;
  region: string;
  telephone: string;
}

export interface CreateCentreAdminPayload {
  nom_complet: string;
  matricule: string;
  email: string;
  telephone: string;
  centre_id: string;
}

export interface Poste {
  id: string;
  libelle: string;
  role_id?: string;
  role?: { id: string; libelle: string };
}

// Rôles backend (table role, normalisés en snake_case par authRoutes.js)
// -> rôles frontend (les 4 rôles fixés par l'encadreur).
function mapBackendRole(role: string): User['role'] {
  const map: Record<string, User['role']> = {
    super_admin: 'SUPER_ADMIN',
    admin: 'ADMIN',
    chef_operationnel: 'CHEF_OPE',
    manager: 'MANAGER',
    operationnel: 'OPERATIONNEL',
  };
  const mapped = map[role];
  if (!mapped) throw new Error(`Rôle non reconnu par l'application : ${role}`);
  return mapped;
}

export const apiService = {
    async login(identifiant: string, password: string): Promise<LoginResult> {
    const raw = await request<{ token: string; user: any }>(
      '/auth/login',
            { method: 'POST', body: JSON.stringify({ matricule: identifiant, password }) },
      false,
    );

    return {
      token: raw.token,
      user: {
        id: String(raw.user.id),
        nom_complet: raw.user.name,
        email: raw.user.email,
        role: mapBackendRole(raw.user.role),
        partenaireIds: Array.isArray(raw.user.partenaire_ids)
          ? raw.user.partenaire_ids.map(String)
          : raw.user.da_id ? [String(raw.user.da_id)] : [],
        partenaires: Array.isArray(raw.user.partenaires)
          ? raw.user.partenaires.map((partner: any) => ({
              id: String(partner.id),
              nom: String(partner.nom || ''),
              code: partner.code ? String(partner.code) : undefined,
            }))
          : [],
        partenaireId: raw.user.da_id ? String(raw.user.da_id) : undefined,
        mustChangePassword: Boolean(raw.user.must_change_password),
        centerId: raw.user.centerId ? String(raw.user.centerId) : null,
        centre: raw.user.centre || null,
        chefOperationnel: raw.user.chef_operationnel ? {
          id: String(raw.user.chef_operationnel.id),
          nomComplet: String(raw.user.chef_operationnel.nom_complet || ''),
          matricule: String(raw.user.chef_operationnel.matricule || ''),
        } : null,
      },
    };
  },

  async requestAccess(payload: AccessRequestPayload) {
    return request('/accounts/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, false);
  },

  async getRequestRoles(): Promise<RequestRole[]> {
    return request<RequestRole[]>('/accounts/request-roles', { method: 'GET' }, false);
  },

  async getPublicCentres(): Promise<PublicCentre[]> {
    return request<PublicCentre[]>('/centres/public', { method: 'GET' }, false);
  },

  async getPublicChefs(centreId: string): Promise<PublicChefOperationnel[]> {
    return request<PublicChefOperationnel[]>(
      `/centres/public/${encodeURIComponent(centreId)}/chefs-operationnels`,
      { method: 'GET' },
      false,
    );
  },

  async getSuperAdminOverview(): Promise<SuperAdminOverview> {
    return request<SuperAdminOverview>('/super-admin/overview');
  },

  async getSuperAdminCentres(): Promise<CentreRecord[]> {
    return request<CentreRecord[]>('/super-admin/centres');
  },

  async createCentre(payload: CreateCentrePayload): Promise<CentreRecord> {
    return request<CentreRecord>('/super-admin/centres', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateCentre(id: string, payload: Partial<CreateCentrePayload>): Promise<CentreRecord> {
    return request<CentreRecord>(`/super-admin/centres/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },

  async setCentreStatus(id: string, active: boolean): Promise<CentreRecord> {
    return request<CentreRecord>(`/super-admin/centres/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ active }) });
  },

  async getSuperAdminAdmins(): Promise<AdminRecord[]> {
    return request<AdminRecord[]>('/super-admin/admins');
  },

  async createCentreAdmin(payload: CreateCentreAdminPayload): Promise<AccountDecisionResult> {
    return request<AccountDecisionResult>('/super-admin/admins', { method: 'POST', body: JSON.stringify(payload) });
  },

  async setAdminStatus(id: string, statut: 'actif' | 'suspendu'): Promise<AdminRecord> {
    return request<AdminRecord>(`/super-admin/admins/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ statut }) });
  },

  async resetCentreAdminPassword(id: string): Promise<AccountDecisionResult> {
    return request<AccountDecisionResult>(`/super-admin/admins/${encodeURIComponent(id)}/reset-password`, { method: 'PATCH' });
  },

  async getPostes(): Promise<Poste[]> {
    return request<Poste[]>('/accounts/postes', { method: 'GET' }, false);
  },

  async requestPasswordReset(matricule: string): Promise<{ message: string }> {
    return request<{ message: string }>('/accounts/password-reset', {
      method: 'POST',
      body: JSON.stringify({ identifiant: matricule }),
    }, false);
  },

  async deleteAccount(email: string, password: string) {
    return request('/accounts/delete', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  },

  async getPendingAccounts(): Promise<any[]> {
    return request<any[]>('/accounts/pending');
  },

  async getAccounts(): Promise<any[]> {
    return request<any[]>('/accounts/users');
  },

  async createAdminAccount(payload: AdminAccountPayload): Promise<AccountDecisionResult> {
    return request<AccountDecisionResult>('/accounts/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteAdminAccount(userId: string): Promise<{ id: string; deleted: boolean }> {
    return request<{ id: string; deleted: boolean }>(`/accounts/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  },

  async resetAdminPassword(userId: string): Promise<AccountDecisionResult> {
    return request<AccountDecisionResult>(`/accounts/users/${encodeURIComponent(userId)}/reset-password`, {
      method: 'PATCH',
    });
  },

  async approveAccount(id: string): Promise<AccountDecisionResult> {
    return request<AccountDecisionResult>(`/accounts/${encodeURIComponent(id)}/approve`, { method: 'PATCH' });
  },

  async changeTemporaryPassword(currentPassword: string, newPassword: string): Promise<{ changed: boolean }> {
    return request<{ changed: boolean }>('/auth/change-temporary-password', {
      method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async rejectAccount(id: string, motif?: string): Promise<any> {
    return request(`/accounts/${encodeURIComponent(id)}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ motif }),
    });
  },

  async getHierarchie(): Promise<DAHierarchy> {
    const hierarchy = await request<DAHierarchy>('/hierarchie');
    return normalizeHierarchy(hierarchy);
  },

  async getDashboard(type: EntityType, id: string, month?: string): Promise<DashboardData> {
    const monthParam = month ? `&month=${encodeURIComponent(month)}` : '';
    return request<DashboardData>(`/dashboard?type=${type}&id=${encodeURIComponent(id)}${monthParam}`);
  },

  async clearDailyTracking(type: EntityType, id: string, month: string): Promise<{ deleted: number }> {
    return request<{ deleted: number }>(`/saisies?entity_type=${type}&entity_id=${encodeURIComponent(id)}&month=${encodeURIComponent(month)}`, { method: 'DELETE' });
  },

  async postSaisie(payload: { entity_type: EntityType; entity_id: string; date: string; vente_jour: number; stock_journalier: number }): Promise<DailyRecord> {
    return request<DailyRecord>('/saisies', { method: 'POST', body: JSON.stringify(payload) });
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
  async getCalendrierAchat(entity: Pick<CalendarEntity, 'type' | 'id'>, year: number, month: number): Promise<Record<string, number>> {
    return request(`/calendrier-achat?entity_type=${entity.type}&entity_id=${encodeURIComponent(entity.id)}&year=${year}&month=${month}`);
  },

  async saveCalendrierAchat(entity: Pick<CalendarEntity, 'type' | 'id'>, forecasts: Record<string, number>): Promise<CalendarSaveRow[]> {
    return request<CalendarSaveRow[]>('/calendrier-achat', {
      method: 'POST',
      body: JSON.stringify({ entity_type: entity.type, entity_id: entity.id, forecasts }),
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

  // --- Opérationnels & affectations réelles ---
  async getOperationnels(): Promise<Operationnel[]> {
    return request<Operationnel[]>('/operationnels');
  },

  async getAffectations(): Promise<OperationalAssignment[]> {
    return request<OperationalAssignment[]>('/affectations');
  },

  async creerPartenaire(payload: AddPartnerPayload): Promise<{ id: string; nom: string; code: string; date_creation: string }> {
    return request<{ id: string; nom: string; code: string; date_creation: string }>('/partenaires', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Affectation explicite de plusieurs partenaires à un opérationnel.
  async changerAffectation(
    userId: string,
    payload: { partenaireIds: string[] },
  ): Promise<OperationalAssignment> {
    return request<OperationalAssignment>(`/affectations/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async updateOperationnelStatus(userId: string, statut: 'actif' | 'suspendu' | 'inactif'): Promise<OperationalAssignment> {
    return request<OperationalAssignment>(`/operationnels/${encodeURIComponent(userId)}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    });
  },

  async transferOperationnelToChef(userId: string, chefOperationnelId: string): Promise<OperationalAssignment> {
    return request<OperationalAssignment>(`/operationnels/${encodeURIComponent(userId)}/chef`, {
      method: 'PATCH',
      body: JSON.stringify({ chef_operationnel_id: chefOperationnelId }),
    });
  },

  // Historique d'audit enrichi (page « Modifications »).
  async getAudit(): Promise<any[]> {
    return request<any[]>('/dashboard/audit');
  },

  // --- Tableaux enregistrés (snapshots immuables) ---
  async saveSnapshot(payload: {
    entite_type: EntityType;
    entite_id: string;
    entite_nom?: string;
    periode?: string;
    records: unknown[];
  }): Promise<{ id: string; periode: string; lignes: number }> {
    return request('/snapshots', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getSnapshots(): Promise<any[]> {
    return request<any[]>('/snapshots');
  },

  async getSnapshot(id: string): Promise<any> {
    return request(`/snapshots/${encodeURIComponent(id)}/view`);
  },

  async deleteSnapshot(id: string): Promise<void> {
    await request(`/snapshots/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Historique complet des demandes d'acces (toutes statuts).
  async getDemandes(): Promise<any[]> {
    return request<any[]>('/accounts/demandes');
  },

  // Message email de l'administrateur a un utilisateur.
  async sendMessage(userId: string, message: string): Promise<{ userId: string; email: string; sent: boolean }> {
    return request(`/accounts/${encodeURIComponent(userId)}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async deletePartner(id: string): Promise<void> {
    await request(`/organization/clients/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async updatePartner(id: string, nom: string): Promise<void> {
    await request(`/organization/clients/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify({ nom }),
    });
  },

  async createDsm(payload: CreateDsmPayload): Promise<void> {
    await request('/organization/dsms', {
      method: 'POST', body: JSON.stringify(payload),
    });
  },

  async updateDsm(id: string, nom: string): Promise<void> {
    await request(`/organization/dsms/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify({ nom }),
    });
  },

  async createPos(payload: CreatePosPayload): Promise<void> {
    await request('/organization/pos', {
      method: 'POST', body: JSON.stringify(payload),
    });
  },

  async updatePos(id: string, updates: { nom?: string; dsm_id?: string }): Promise<void> {
    await request(`/organization/pos/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify(updates),
    });
  },

  async deleteDsm(id: string): Promise<void> {
    await request(`/organization/dsms/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async deletePos(id: string): Promise<void> {
    await request(`/organization/pos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Téléchargement CSV du tableau stocké (lecture seule, avec token).
  async downloadSnapshot(id: string, filename: string): Promise<void> {
    const res = await fetchWithTimeout(`/api/snapshots/${encodeURIComponent(id)}/download`, {
      headers: buildHeaders(true),
    });
    if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
