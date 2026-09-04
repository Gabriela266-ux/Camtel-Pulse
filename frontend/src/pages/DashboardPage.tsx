import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, CheckCircle2, Home, LogOut, Menu, Moon, Search, SunMedium } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { DailyTrackingTable } from '../components/dashboard/DailyTrackingTable';
import { EntryModal } from '../components/dashboard/EntryModal';
import { ForecastModal } from '../components/dashboard/ForecastModal';
import { ObjectiveModal } from '../components/dashboard/ObjectiveModal';
import { AssignmentModal } from '../components/dashboard/AssignmentModal';
import { apiService } from '../api/services';

import type {
  DAHierarchy,
  CalendarEntity,
  DailyRecord,
  DashboardData,
  EntitySelection,
  EntityType,
  CreateDsmPayload,
  CreatePosPayload,
  OperationalAssignment,
} from '../types';
import type { AddPartnerPayload, Operationnel } from '../types';
import { useAuth } from '../auth/useAuth';
import { ConsumptionChart } from '../components/dashboard/ConsumptionChart';
import { ProgressIndicators } from '../components/dashboard/ProgressIndicators';
import { RoleWorkspace } from '../components/dashboard/RoleWorkspace';
import { AddPartnerModal } from '../components/dashboard/AddPartnerModal';
import { NetworkEntityModal } from '../components/dashboard/NetworkEntityModal';
import type { NetworkEntityContext } from '../components/dashboard/NetworkEntityModal';
import { AlertDetailsModal } from '../components/dashboard/AlertDetailsModal';
import { SnapshotsPanel } from '../components/dashboard/SnapshotsPanel';
import { findFirstHierarchyMatch } from '../utils/hierarchySearch';
import { CenterRevenuePanel } from '../components/dashboard/CenterRevenuePanel';

interface DashboardPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

function listDSM(tree: DAHierarchy) {
  return tree.da.flatMap((da) =>
    da.dsm.map((dsm) => ({
      id: dsm.id,
      label: `${da.nom} / ${dsm.nom}`,
    })),
  );
}

function getEntryContext(entityType: EntityType, entityId: string, entityName: string) {
  return { entityId, entityType, entityName: entityName || 'Périmètre sélectionné' };
}

function daysInCurrentMonthFor(dateStr: string) {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  return new Date(year, month, 0).getDate();
}

const EMPTY_HIERARCHY: DAHierarchy = { id: '', nom: '', da: [] };
const EMPTY_DASHBOARD: DashboardData = {
  entite_id: '',
  nom_entite: '',
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

export const DashboardPage: React.FC<DashboardPageProps> = ({ isDark, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<DAHierarchy>(EMPTY_HIERARCHY);
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('DA');
  const [selectedEntity, setSelectedEntity] = useState<EntitySelection | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const entityRequestSequence = useRef(0);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const initialMonth = useRef(referenceDate.slice(0, 7));
  const [globalSearch, setGlobalSearch] = useState('');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false);
  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<OperationalAssignment[]>([]);
  const [operationnels, setOperationnels] = useState<Operationnel[]>([]);
  const [userAccounts, setUserAccounts] = useState<Array<{ id: string; nom_complet: string; email?: string; matricule?: string; statut: string; role?: { libelle?: string }; poste?: { libelle?: string }; centre?: { nom_centre?: string; code_centre?: string } }>>([]);
  const [centreRevenue, setCentreRevenue] = useState<{ months: string[]; centres: Array<{ id: string; nom: string; code: string; monthly: Array<{ month: string; montant: number }>; total: number }>; criticalCases: Array<{ type: string; nom: string; centre: string; message: string }> } | null>(null);
  const [assignmentToEdit, setAssignmentToEdit] = useState<OperationalAssignment | null>(null);
  const [addPartnerModalOpen, setAddPartnerModalOpen] = useState(false);
  const [networkEntityContext, setNetworkEntityContext] = useState<NetworkEntityContext | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDetailEntity, setSelectedDetailEntity] = useState<{ id: string; nom: string } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const role = user?.role ?? 'OPERATIONNEL';
  const canCreateEntry = role === 'OPERATIONNEL' || role === 'CHEF_OPE';
  // Le dashboard Admin suit le même principe que celui du Manager : consultation
  // et téléchargement uniquement. Les mutations restent dans l'espace Admin.
  const canSaveSnapshot = role === 'OPERATIONNEL' || role === 'CHEF_OPE';
  const canClearTracking = role === 'OPERATIONNEL' || role === 'CHEF_OPE';
  const canCreateForecast = role === 'OPERATIONNEL' || role === 'CHEF_OPE';

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const isOperational = role === 'OPERATIONNEL';
  const assignedPartnerIds = useMemo(() => user?.partenaireIds?.length
    ? user.partenaireIds
    : user?.partenaireId ? [user.partenaireId] : [], [user?.partenaireId, user?.partenaireIds]);
  const visibleHierarchy = isOperational
    ? { ...hierarchyData, da: hierarchyData.da.filter((da) => assignedPartnerIds.includes(da.id)) }
    : hierarchyData;

  const canAccessDA = (daId: string) => role !== 'OPERATIONNEL' || assignedPartnerIds.includes(daId);

  const loadSelectedEntity = useCallback(async (entity: EntitySelection, month: string): Promise<void> => {
    const requestSequence = entityRequestSequence.current + 1;
    entityRequestSequence.current = requestSequence;
    setSelectedEntity(entity);
    setSelectedEntityType(entity.type);
    setLoadingEntity(true);
    setRecords([]);
    setDashboardData({
      ...EMPTY_DASHBOARD,
      entite_id: entity.id,
      nom_entite: entity.nom,
    });

    try {
      const [dashboard, scopedRecords] = await Promise.all([
        apiService.getDashboard(entity.type, entity.id, month),
        apiService.getRecords(entity.type, entity.id, month),
      ]);
      if (entityRequestSequence.current !== requestSequence) return;
      if (String(dashboard.entite_id) !== String(entity.id)) {
        throw new Error('La réponse KPI ne correspond pas à l’entité sélectionnée');
      }
      setDashboardData(dashboard);
      setRecords(scopedRecords as DailyRecord[]);
    } catch (error) {
      if (entityRequestSequence.current !== requestSequence) return;
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Chargement de l’entité impossible.' });
    } finally {
      if (entityRequestSequence.current === requestSequence) setLoadingEntity(false);
    }
  }, []);

  useEffect(() => {
    setLoadingHierarchy(true);
    apiService
      .getHierarchie()
      .then((data) => {
        setHierarchyData(data);
        const firstDA = isOperational
          ? data.da.find((da) => assignedPartnerIds.includes(da.id))
          : data.da[0];
        if (firstDA) {
          void loadSelectedEntity({ type: 'DA', id: firstDA.id, nom: firstDA.nom }, initialMonth.current);
        }
      })
      .catch((err) => console.error('Impossible de charger la hiérarchie :', err))
      .finally(() => setLoadingHierarchy(false));

    apiService
      .getOperationnels()
      .then((data) => setOperationnels(data))
      .catch((err) => console.error('Impossible de charger les opérationnels :', err));

    apiService
      .getAffectations()
      .then((data) => setAssignments(data))
      .catch((err) => console.error('Impossible de charger les affectations :', err));

    if (role === 'MANAGER') {
      apiService
        .getUsers()
        .then((data) => setUserAccounts(data))
        .catch((err) => console.error('Impossible de charger les comptes :', err));
      apiService
        .getCentreRevenue()
        .then((data) => setCentreRevenue(data))
        .catch((err) => console.error('Impossible de charger le chiffre d’affaires :', err));
    }
  }, [assignedPartnerIds, isOperational, loadSelectedEntity, role]);

  const handleSelectEntity = (entity: EntitySelection) => {
    void loadSelectedEntity(entity, referenceDate.slice(0, 7));
  };

  const handleGlobalSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const result = findFirstHierarchyMatch(visibleHierarchy, globalSearch);
    if (result) {
      handleSelectEntity(result);
      return;
    }
    setToast({ type: 'error', message: 'Aucune entité trouvée pour ce nom, numéro, code ou cette zone.' });
  };

  const handleRefreshDashboard = async (): Promise<void> => {
    if (!selectedEntity) return;
    const activeMonth = referenceDate.slice(0, 7);
    if (!window.confirm(`Vider définitivement le suivi de ${selectedEntity.nom} pour ${activeMonth} ? Cette action supprime les saisies, stocks et calendriers de la période.`)) return;
    try {
      const result = await apiService.clearDailyTracking(selectedEntity.type, selectedEntity.id, activeMonth);
      await loadSelectedEntity(selectedEntity, activeMonth);
      setToast({ type: 'success', message: `${result.deleted} enregistrement(s) supprimé(s).` });
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Vidage impossible.' });
    }
  };

  const handleAddPartner = () => {
    setAddPartnerModalOpen(true);
  };

  const handleShowDetails = () => {
    setSelectedDetailEntity({ id: dashboardData.entite_id, nom: dashboardData.nom_entite });
    setIsDetailsOpen(true);
  };

  const handleCreatePartner = async (payload: AddPartnerPayload): Promise<void> => {
    try {
      await apiService.creerPartenaire(payload);
      const [hierarchy, refreshedAssignments] = await Promise.all([
        apiService.getHierarchie(),
        apiService.getAffectations(),
      ]);
      setHierarchyData(hierarchy);
      setAssignments(refreshedAssignments);
      setAddPartnerModalOpen(false);
      setToast({ type: 'success', message: 'Partenaire créé sans affectation automatique.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Création du partenaire impossible.';
      setToast({ type: 'error', message });
      throw error;
    }
  };

  const reloadHierarchy = async () => {
    const data = await apiService.getHierarchie();
    setHierarchyData(data);
  };

  const handleEditPartner = async (partnerId: string) => {
    const partner = hierarchyData.da.find((da) => da.id === partnerId);
    if (!partner) return;

    const nextName = window.prompt('Nouveau nom du partenaire', partner.nom);
    if (!nextName?.trim()) return;

    try {
      await apiService.updatePartner(partnerId, nextName.trim());
      await reloadHierarchy();
      setToast({ type: 'success', message: 'Partenaire modifié et enregistré.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Modification impossible.' });
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    const partner = hierarchyData.da.find((da) => da.id === partnerId);
    if (!partner) return;

    const confirmed = window.confirm(`Supprimer le partenaire "${partner.nom}" ?`);
    if (!confirmed) return;

    try {
      await apiService.deletePartner(partnerId);
      setHierarchyData((tree) => ({ ...tree, da: tree.da.filter((da) => da.id !== partnerId) }));
    } catch (err) {
      console.error('Échec de la suppression définitive du partenaire :', err);
      window.alert(err instanceof Error ? err.message : 'Suppression impossible');
    }
  };

  const handleAddDSM = (daId: string) => {
    if (!canAccessDA(daId)) return;
    const partner = hierarchyData.da.find((item) => item.id === daId);
    if (!partner) return;
    setNetworkEntityContext({
      type: 'DSM',
      daId,
      partnerName: partner.nom,
      partnerZone: partner.code_zone,
    });
  };

  const handleEditDSM = async (dsmId: string) => {
    const parentDA = hierarchyData.da.find((da) => da.dsm.some((dsm) => dsm.id === dsmId));
    if (!parentDA || !canAccessDA(parentDA.id)) return;

    const dsm = parentDA.dsm.find((item) => item.id === dsmId);
    if (!dsm) return;

    const nextName = window.prompt('Nouveau nom du DSM', dsm.nom);
    if (!nextName?.trim()) return;

    try {
      await apiService.updateDsm(dsmId, nextName.trim());
      await reloadHierarchy();
      setToast({ type: 'success', message: 'DSM modifié et enregistré.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Modification du DSM impossible.' });
    }
  };

  const handleDeleteDSM = async (dsmId: string) => {
    const parentDA = hierarchyData.da.find((da) => da.dsm.some((dsm) => dsm.id === dsmId));
    if (!parentDA || !canAccessDA(parentDA.id)) return;

    const dsm = parentDA.dsm.find((item) => item.id === dsmId);
    if (!dsm) return;

    const confirmed = window.confirm(`Supprimer le DSM "${dsm.nom}" ?`);
    if (!confirmed) return;

    try {
      await apiService.deleteDsm(dsmId);
      setHierarchyData((tree) => ({
        ...tree,
        da: tree.da.map((da) => ({ ...da, dsm: da.dsm.filter((item) => item.id !== dsmId) })),
      }));
    } catch (err) {
      console.error('Échec de la suppression définitive du DSM :', err);
      window.alert(err instanceof Error ? err.message : 'Suppression impossible');
    }
  };

  const handleAddPOS = (dsmId: string) => {
    const parentDA = hierarchyData.da.find((da) =>
      da.dsm.some((dsm) => dsm.id === dsmId),
    );
    if (!parentDA || !canAccessDA(parentDA.id)) return;
    const dsm = parentDA.dsm.find((item) => item.id === dsmId);
    if (!dsm) return;
    if (!dsm.code_dsm || !dsm.code_zone) {
      setToast({ type: 'error', message: 'Complétez le code DSM et le code zone avant d’ajouter un POS.' });
      return;
    }
    setNetworkEntityContext({
      type: 'POS',
      dsmId,
      dsmName: dsm.nom,
      codeDsm: dsm.code_dsm,
      codeZone: dsm.code_zone,
    });
  };

  const handleCreateNetworkEntity = async (payload: CreateDsmPayload | CreatePosPayload): Promise<void> => {
    try {
      if ('da_id' in payload) {
        await apiService.createDsm(payload);
      } else {
        await apiService.createPos(payload);
      }
      await reloadHierarchy();
      setNetworkEntityContext(null);
      setToast({ type: 'success', message: `${'da_id' in payload ? 'DSM' : 'POS'} créé et enregistré.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Création de l’entité impossible.';
      setToast({ type: 'error', message });
      throw error;
    }
  };

  const handleEditPOS = async (posId: string) => {
    const parentDA = hierarchyData.da.find((da) =>
      da.dsm.some((dsm) => dsm.pos.some((pos) => pos.id === posId)),
    );
    const parentDSM = parentDA?.dsm.find((dsm) => dsm.pos.some((pos) => pos.id === posId));
    const pos = parentDSM?.pos.find((item) => item.id === posId);
    if (!parentDA || !parentDSM || !pos || !canAccessDA(parentDA.id)) return;

    const nextName = window.prompt('Nouveau nom du POS', pos.nom);
    if (!nextName?.trim()) return;

    try {
      await apiService.updatePos(posId, { nom: nextName.trim() });
      await reloadHierarchy();
      setToast({ type: 'success', message: 'POS modifié et enregistré.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Modification du POS impossible.' });
    }
  };

  const handleDeletePOS = async (posId: string) => {
    const parentDA = hierarchyData.da.find((da) =>
      da.dsm.some((dsm) => dsm.pos.some((pos) => pos.id === posId)),
    );
    const parentDSM = parentDA?.dsm.find((dsm) => dsm.pos.some((pos) => pos.id === posId));
    const pos = parentDSM?.pos.find((item) => item.id === posId);
    if (!parentDA || !parentDSM || !pos || !canAccessDA(parentDA.id)) return;

    const confirmed = window.confirm(`Supprimer le POS "${pos.nom}" ?`);
    if (!confirmed) return;

    try {
      await apiService.deletePos(posId);
      setHierarchyData((tree) => ({
        ...tree,
        da: tree.da.map((da) => ({
          ...da,
          dsm: da.dsm.map((dsm) => ({ ...dsm, pos: dsm.pos.filter((item) => item.id !== posId) })),
        })),
      }));
    } catch (err) {
      console.error('Échec de la suppression définitive du POS :', err);
      window.alert(err instanceof Error ? err.message : 'Suppression impossible');
    }
  };

  const handleMovePOS = async (posId: string) => {
    const dsms = listDSM(hierarchyData);
    if (dsms.length === 0) return;

    const target = window.prompt(
      `ID du DSM de destination:\n${dsms.map((dsm) => `${dsm.id} - ${dsm.label}`).join('\n')}`,
    );
    const targetDsmId = target?.trim();
    if (!targetDsmId || !dsms.some((dsm) => dsm.id === targetDsmId)) return;

    try {
      await apiService.updatePos(posId, { dsm_id: targetDsmId });
      await reloadHierarchy();
      setToast({ type: 'success', message: 'POS déplacé et enregistré.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Déplacement du POS impossible.' });
    }
  };

  const handleSubmitEntry = async (payload: {
    entityId: string;
    entityType: EntityType;
    date: string;
    stockJournalier: number;
    achat: number;
  }): Promise<void> => {
    const requestSequence = entityRequestSequence.current;
    const activeEntity = selectedEntity;
    if (!activeEntity) throw new Error('Aucune entité active');
    try {
      await apiService.postSaisie({
        entity_type: payload.entityType,
        entity_id: payload.entityId,
        date: payload.date,
        vente_jour: payload.achat,
        stock_journalier: payload.stockJournalier,
      });

      const [dashboard, refreshedRecords] = await Promise.all([
        apiService.getDashboard(activeEntity.type, activeEntity.id, payload.date.slice(0, 7)),
        apiService.getRecords(activeEntity.type, activeEntity.id, payload.date.slice(0, 7)),
      ]);
      if (entityRequestSequence.current !== requestSequence) return;
      setDashboardData(dashboard);
      setRecords(refreshedRecords as DailyRecord[]);
      setReferenceDate(payload.date);
      setToast({ type: 'success', message: 'Saisie journalière enregistrée et tableau actualisé.' });
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Échec de la saisie journalière.' });
      throw error;
    }
  };

  const { kpi } = dashboardData;
  const stockSecurite = (kpi.objectif_mensuel / daysInCurrentMonthFor(referenceDate)) * 3;

  // Enregistre le tableau courant comme snapshot immuable en base.
  const handleSaveSnapshot = async () => {
    if (!selectedEntity) throw new Error('Aucune entité active');
    await apiService.saveSnapshot({
      entite_type: selectedEntity.type,
      entite_id: selectedEntity.id,
      entite_nom: selectedEntity.nom,
      periode: referenceDate.slice(0, 7),
      records,
    });
  };

  // Agrégats réels du mois chargé (issues des relevés /records) pour les indicateurs de
  // progression : pas de valeur en dur, tout est recalculé à partir des données backend.
  const achatTotal = records.reduce((sum, record) => sum + (record.achat ?? 0), 0);
  const objectifTotalCalendrierAchat = records.reduce(
    (sum, record) => sum + (record.prevision_ca ?? 0),
    0,
  );

  const handleSaveForecasts = async (
    entity: CalendarEntity,
    year: number,
    month: number,
    forecasts: Record<string, number>,
  ): Promise<void> => {
    const requestSequence = entityRequestSequence.current;
    const activeEntity = selectedEntity;
    if (!activeEntity) throw new Error('Aucune entité active');
    const isoForecasts: Record<string, number> = {};
    Object.entries(forecasts).forEach(([dateKey, value]) => {
      const [day, mon, yr] = dateKey.split('/');
      isoForecasts[`${yr}-${mon}-${day}`] = value;
    });

    try {
      await apiService.saveCalendrierAchat(entity, isoForecasts);

      const period = `${year}-${String(month).padStart(2, '0')}`;
      const [dashboard, data] = await Promise.all([
        apiService.getDashboard(activeEntity.type, activeEntity.id, period),
        apiService.getRecords(activeEntity.type, activeEntity.id, period),
      ]);
      if (entityRequestSequence.current !== requestSequence) return;
      setDashboardData(dashboard);
      setRecords(data as DailyRecord[]);
      setReferenceDate(`${period}-01`);
      setToast({ type: 'success', message: `Calendrier d’achat enregistré : ${Object.keys(isoForecasts).length} jour(s) actualisé(s).` });
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : "Échec de l’enregistrement du calendrier d’achat." });
      throw error;
    }
  };

  const handleSaveObjective = (value: number) => {
    if (!selectedEntity) return;
    const currentType = selectedEntity.type;
    const currentId = selectedEntity.id;
    const requestSequence = entityRequestSequence.current;

    setDashboardData((prev) => ({
      ...prev,
      kpi: {
        ...prev.kpi,
        objectif_mensuel: value,
      },
    }));

    apiService
      .updateObjective(currentType, currentId, value)
      .then(() => apiService.getDashboard(currentType, currentId, referenceDate.slice(0, 7)))
      .then((data) => {
        if (entityRequestSequence.current === requestSequence) setDashboardData(data);
      })
      .catch((err) => console.error("Échec de l'enregistrement de l'objectif :", err));
  };

  const handleAssignmentChange = async (updatedAssignment: OperationalAssignment): Promise<void> => {
    try {
      const saved = await apiService.changerAffectation(String(updatedAssignment.userId), {
        partenaireIds: updatedAssignment.partenaireIds,
      });
      setAssignments((currentAssignments) =>
        currentAssignments.map((assignment) => assignment.userId === saved.userId ? saved : assignment),
      );
      setAssignmentToEdit(null);
      setToast({ type: 'success', message: 'Affectations enregistrées et historisées.' });
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : "Échec de l’affectation." });
      throw error;
    }
  };

  const handleToggleStatus = async (assignment: OperationalAssignment) => {
    const nextStatus = assignment.statut === 'suspendu' ? 'actif' : 'suspendu';
    try {
      const saved = await apiService.updateOperationnelStatus(String(assignment.userId), nextStatus);
      setAssignments((current) =>
        current.map((a) => (a.userId === saved.userId ? saved : a)),
      );
    } catch (err) {
      console.error("Échec de la mise à jour du statut :", err);
      apiService
        .getAffectations()
        .then((data) => setAssignments(data))
        .catch(() => undefined);
    }
  };

  const monthLabel = new Date(referenceDate).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`flex min-h-screen font-sans ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed right-4 top-4 z-[80] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}
        >
          {toast.message}
        </div>
      )}
      {/* Overlay du drawer mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {loadingHierarchy ? (
        <div className="flex w-full items-center justify-center p-6 text-sm text-slate-400 lg:w-72 lg:border-r lg:border-slate-800/20">
          Chargement de la hiérarchie...
        </div>
      ) : (
        <Sidebar
          hierarchyData={visibleHierarchy}
          role={role}
          user={user}
          onSelectEntity={handleSelectEntity}
          onAddPartner={handleAddPartner}
          onManageOperationnels={() => document.getElementById('gestion-operationnels')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          onEditPartner={handleEditPartner}
          onDeletePartner={handleDeletePartner}
          onAddDSM={handleAddDSM}
          onEditDSM={handleEditDSM}
          onDeleteDSM={handleDeleteDSM}
          onAddPOS={handleAddPOS}
          onEditPOS={handleEditPOS}
          onDeletePOS={handleDeletePOS}
          onMovePOS={handleMovePOS}
          selectedEntityId={selectedEntity?.id}
          isDark={isDark}
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-3 sm:px-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition lg:hidden ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
              aria-label="Ouvrir le menu"
              title="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-black uppercase tracking-[0.14em] text-sky-600 sm:block">
                Centre / {selectedEntityType}
              </p>
              <h1 className={`truncate text-base font-black sm:text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{dashboardData.nom_entite}</h1>
              <p className={`hidden truncate text-xs sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {role === 'CHEF_OPE'
                  ? 'Création des partenaires et gestion complète du réseau'
                  : role === 'OPERATIONNEL'
                    ? 'Création DSM/POS dans le partenaire affecté'
                    : 'Vue de consultation des indicateurs'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <form onSubmit={handleGlobalSearch} className="relative hidden xl:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Nom, numéro, zone, DSM, POS…"
                aria-label="Recherche globale par nom, numéro, code ou zone"
                className={`w-64 rounded-xl border py-2 pl-9 pr-3 text-xs outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400'}`}
              />
            </form>
            <button
              type="button"
              onClick={handleShowDetails}
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
              aria-label="Consulter les alertes"
              title="Alertes"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {dashboardData.kpi.statut_alerte !== 'NORMAL' && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
              aria-label="Retour à l'accueil"
              title="Retour à l'accueil"
            >
              <Home className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
              className={`hidden h-9 w-9 items-center justify-center rounded-lg border transition lg:inline-flex ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
              aria-label={isSidebarCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
              title={isSidebarCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Basculer le thème"
              title="Basculer le thème"
            >
              {isDark ? <SunMedium className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isDark ? 'Clair' : 'Sombre'}</span>
            </button>

            <input
              type="date"
              value={referenceDate}
              onChange={(event) => {
                const nextDate = event.target.value;
                setReferenceDate(nextDate);
                if (selectedEntity && nextDate) void loadSelectedEntity(selectedEntity, nextDate.slice(0, 7));
              }}
              className={`rounded-lg border px-2.5 py-2 text-xs ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-100'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            />
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className={`rounded-lg px-3 py-2 font-semibold ${
                  isDark ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
                title="Aller à l'espace administrateur"
              >
                Espace Admin
              </button>
            )}
            <span className={`hidden max-w-[180px] truncate rounded-full px-3 py-1.5 text-xs font-bold md:inline ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
              {user?.nom_complet} ({user?.role})
            </span>
            <button
              onClick={logout}
              className={`rounded-lg p-2 transition-colors ${
                isDark ? 'text-slate-300 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
              }`}
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="space-y-4 overflow-x-hidden overflow-y-auto p-4 sm:space-y-6 sm:p-6">
          <RoleWorkspace
            role={role}
            user={user}
            operationnels={operationnels}
            assignments={assignments}
            userAccounts={userAccounts}
            partners={hierarchyData.da}
            records={records}
            onReassign={(assignment) => setAssignmentToEdit(assignment)}
            onToggleStatus={handleToggleStatus}
          />

          {role === 'MANAGER' && <CenterRevenuePanel data={centreRevenue} isDark={isDark} />}

          {loadingEntity && (
            <div role="status" className="panel-soft px-4 py-3 text-sm font-semibold text-slate-500">
              Chargement des données de {selectedEntity?.nom ?? 'l’entité'}…
            </div>
          )}

          {dashboardData?.kpi?.statut_alerte && dashboardData.kpi.statut_alerte !== 'NORMAL' ? (
            <div className="ui-alert border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100" role="alert">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide">Surveillance requise</p>
                <p className="mt-0.5 text-xs opacity-80">{dashboardData.nom_entite ? `${dashboardData.nom_entite} présente un indicateur critique nécessitant une vérification.` : 'Une entité présente un indicateur critique.'}</p>
              </div>
              <button
                type="button"
                onClick={handleShowDetails}
                className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/50"
              >
                Voir les détails <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="ui-alert border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100" role="status">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="text-xs font-semibold">
                {dashboardData?.nom_entite
                  ? `Statut de ${dashboardData.nom_entite} : Normal`
                  : 'Statut : Normal - Aucune alerte sur le périmètre'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="panel-card group p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">Objectif mensuel</div>
                <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700">Cible</span>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-800 dark:text-slate-100">
                {kpi.objectif_mensuel.toLocaleString('fr-FR')} FCFA
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{monthLabel}</div>
              {(role === 'CHEF_OPE' || role === 'OPERATIONNEL') && (
                <button
                  type="button"
                  onClick={() => setObjectiveModalOpen(true)}
                  className="ui-button-secondary mt-4 w-full justify-center"
                >
                  Modifier l'objectif →
                </button>
              )}
            </div>

            <div className="panel-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">Achat cumulé</div>
              <div className="mt-3 text-2xl font-black text-sky-600">
                {kpi.achat_cumule.toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div className="panel-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-500">Stock de sécurité</div>
              <div className="mt-3 text-2xl font-black text-amber-600">
                {stockSecurite.toLocaleString('fr-FR')} U
              </div>
            </div>

            <div className="panel-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">Consommation</div>
              <div className="mt-3 text-2xl font-black text-violet-600">
                {kpi.consommation.toLocaleString('fr-FR')} U
              </div>
            </div>

            <div className="panel-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                Stock journalier moyen hebdo
              </div>
              <div className="mt-3 text-2xl font-black text-emerald-600">
                {(kpi.stock_journalier_moyen_hebdo ?? 0).toLocaleString('fr-FR')} U
              </div>
              {kpi.semaine_label && (
                <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{kpi.semaine_label}</div>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <ConsumptionChart
              records={records}
              stockSecurite={stockSecurite}
              isDark={isDark}
            />

            <ProgressIndicators
              achatTotal={achatTotal}
              objectifMensuel={kpi.objectif_mensuel}
              objectifTotalCalendrierAchat={objectifTotalCalendrierAchat}
            />
          </div>

          <DailyTrackingTable
            records={records}
            canCreateEntry={canCreateEntry && !loadingEntity}
            onNewEntry={() => setEntryModalOpen(true)}
            canCreateForecast={canCreateForecast && !loadingEntity}
            onNewForecast={() => setForecastModalOpen(true)}
            onRefresh={handleRefreshDashboard}
            isDark={isDark}
            stockSecurite={stockSecurite}
            canClear={canClearTracking}
            canSave={canSaveSnapshot}
            onSaveSnapshot={handleSaveSnapshot}
            canViewDetails={role === 'ADMIN' || role === 'MANAGER' || role === 'CHEF_OPE'}
            entityName={selectedEntity?.nom ?? dashboardData.nom_entite}
          />

          {/* Tableaux stockés : consultation + téléchargement (Admin / Manager / Chef). */}
          {(role === 'ADMIN' || role === 'MANAGER' || role === 'CHEF_OPE') && (
            <SnapshotsPanel isDark={isDark} allowDelete={false} />
          )}
        </main>
      </div>

      {entryModalOpen && (() => {
        const context = getEntryContext(selectedEntity?.type ?? selectedEntityType, selectedEntity?.id ?? '', selectedEntity?.nom ?? '');
        return (
          <EntryModal
            defaultDate={referenceDate}
            entityName={context.entityName}
            defaultEntityId={context.entityId}
            defaultEntityType={context.entityType}
            onClose={() => setEntryModalOpen(false)}
            onSubmit={handleSubmitEntry}
          />
        );
      })()}

      <ObjectiveModal
        isOpen={objectiveModalOpen}
        objective={kpi.objectif_mensuel}
        monthLabel={monthLabel}
        onClose={() => setObjectiveModalOpen(false)}
        onSubmit={handleSaveObjective}
      />

      <ForecastModal
        isOpen={forecastModalOpen}
        hierarchyData={visibleHierarchy}
        defaultEntityType={selectedEntity?.type}
        defaultEntityId={selectedEntity?.id}
        onClose={() => setForecastModalOpen(false)}
        onSave={handleSaveForecasts}
        onLoadExisting={(entity, year, month) => apiService.getCalendrierAchat(entity, year, month)}
        isDark={isDark}
      />

      {assignmentToEdit && (
        <AssignmentModal
          assignment={assignmentToEdit}
          partners={hierarchyData.da}
          isDark={isDark}
          onClose={() => setAssignmentToEdit(null)}
          onSubmit={handleAssignmentChange}
        />
      )}

      <AddPartnerModal
        isOpen={addPartnerModalOpen}
        isDark={isDark}
        onClose={() => setAddPartnerModalOpen(false)}
        onSubmit={handleCreatePartner}
      />

      <NetworkEntityModal
        context={networkEntityContext}
        isDark={isDark}
        onClose={() => setNetworkEntityContext(null)}
        onSubmit={handleCreateNetworkEntity}
      />

      {isDetailsOpen && selectedDetailEntity && (
        <AlertDetailsModal
          user={user}
          records={records}
          assignments={assignments}
          entityName={selectedDetailEntity.nom}
          entityId={selectedDetailEntity.id}
          isDark={isDark}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedDetailEntity(null);
          }}
        />
      )}
    </div>
  );
};
