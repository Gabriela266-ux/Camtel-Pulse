import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, SunMedium } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { DailyTrackingTable } from '../components/dashboard/DailyTrackingTable';
import { EntryModal } from '../components/dashboard/EntryModal';
import { ForecastModal } from '../components/dashboard/ForecastModal';
import { ObjectiveModal } from '../components/dashboard/ObjectiveModal';
import { AssignmentModal } from '../components/dashboard/AssignmentModal';
import { apiService } from '../api/services';

import type {
  CentreHierarchy,
  DailyRecord,
  DashboardData,
  DSMNode,
  EntitySelection,
  EntityType,
  OperationalAssignment,
  POSNode,
} from '../types';
import type { AddPartnerPayload, Operationnel } from '../types';
import { useAuth } from '../auth/AuthContext';
import { ConsumptionChart } from '../components/dashboard/ConsumptionChart';
import { ProgressIndicators } from '../components/dashboard/ProgressIndicators';
import { RoleWorkspace } from '../components/dashboard/RoleWorkspace';
import { AddPartnerModal } from '../components/dashboard/AddPartnerModal';

interface DashboardPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

function addDSM(tree: CentreHierarchy, daId: string, dsm: DSMNode): CentreHierarchy {
  return {
    ...tree,
    da: tree.da.map((da) => (da.id === daId ? { ...da, dsm: [...da.dsm, dsm] } : da)),
  };
}

function addPOS(tree: CentreHierarchy, dsmId: string, pos: POSNode): CentreHierarchy {
  return {
    ...tree,
    da: tree.da.map((da) => ({
      ...da,
      dsm: da.dsm.map((dsm) => (dsm.id === dsmId ? { ...dsm, pos: [...dsm.pos, pos] } : dsm)),
    })),
  };
}

function movePOS(tree: CentreHierarchy, posId: string, targetDsmId: string): CentreHierarchy {
  let movedPOS: POSNode | undefined;
  const withoutPOS: CentreHierarchy = {
    ...tree,
    da: tree.da.map((da) => ({
      ...da,
      dsm: da.dsm.map((dsm) => {
        const found = dsm.pos.find((pos) => pos.id === posId);
        if (found) movedPOS = found;
        return { ...dsm, pos: dsm.pos.filter((pos) => pos.id !== posId) };
      }),
    })),
  };

  if (!movedPOS) return tree;
  return addPOS(withoutPOS, targetDsmId, movedPOS);
}

function listDSM(tree: CentreHierarchy) {
  return tree.da.flatMap((da) =>
    da.dsm.map((dsm) => ({
      id: dsm.id,
      label: `${da.nom} / ${dsm.nom}`,
    })),
  );
}

function daysInCurrentMonthFor(dateStr: string) {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  return new Date(year, month, 0).getDate();
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ isDark, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const emptyHierarchy: CentreHierarchy = { id: '', nom: '', da: [] };
  const emptyDashboard: DashboardData = {
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

  const [hierarchyData, setHierarchyData] = useState<CentreHierarchy>(emptyHierarchy);
  const [dashboardData, setDashboardData] = useState<DashboardData>(emptyDashboard);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('DA');
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false);
  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<OperationalAssignment[]>([]);
  const [operationnels, setOperationnels] = useState<Operationnel[]>([]);
  const [assignmentToEdit, setAssignmentToEdit] = useState<OperationalAssignment | null>(null);
  const [addPartnerModalOpen, setAddPartnerModalOpen] = useState(false);

  const role = user?.role ?? 'OPERATIONNEL';
  const canCreateEntry = role === 'OPERATIONNEL' || role === 'CHEF_OPE';
  const canCreateForecast = role === 'OPERATIONNEL' || role === 'CHEF_OPE';

  const isOperational = role === 'OPERATIONNEL';
  const visibleHierarchy =
    isOperational && user?.partenaireId
      ? {
          ...hierarchyData,
          da: hierarchyData.da.filter((da) => da.id === user.partenaireId),
        }
      : hierarchyData;

  const canManageNetwork = role === 'CHEF_OPE' || role === 'OPERATIONNEL';

  const canAccessDA = (daId: string) => role !== 'OPERATIONNEL' || user?.partenaireId === daId;

  // Charge la hiérarchie, les affectations et les opérationnels réels depuis le backend.
  useEffect(() => {
    setLoadingHierarchy(true);
    apiService
      .getHierarchie()
      .then((data) => {
        setHierarchyData(data);
        const firstDA = data.da[0];
        if (firstDA) {
          setSelectedEntityType('DA');
          setDashboardData((prev) => ({ ...prev, entite_id: firstDA.id, nom_entite: firstDA.nom }));
          apiService
            .getDashboard('DA', firstDA.id)
            .then((d) => setDashboardData(d))
            .catch((err) => console.error('Impossible de charger les KPI initiaux :', err));
          apiService
            .getRecords('DA', firstDA.id)
            .then((data) => setRecords(data as DailyRecord[]))
            .catch((err) => console.error("Impossible de charger l'historique journalier :", err));
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
  }, []);

  const handleSelectEntity = (entity: EntitySelection) => {
    setSelectedEntityType(entity.type);
    setDashboardData((prev) => ({
      ...prev,
      entite_id: entity.id,
      nom_entite: entity.nom,
    }));

    apiService
      .getDashboard(entity.type, entity.id)
      .then((data) => setDashboardData(data))
      .catch((err) => console.error('Impossible de charger les KPI de cette entité :', err));

    apiService
      .getRecords(entity.type, entity.id)
      .then((data) => setRecords(data as DailyRecord[]))
      .catch((err) => console.error("Impossible de charger l'historique journalier :", err));
  };

  const handleAddPartner = () => {
    setAddPartnerModalOpen(true);
  };

  const handleCreatePartner = (payload: AddPartnerPayload) => {
    apiService
      .creerPartenaire(payload)
      .then(() => {
        setAddPartnerModalOpen(false);
        // Recharge la hiérarchie et les affectations pour refléter la donnée réelle.
        apiService
          .getHierarchie()
          .then((data) => setHierarchyData(data))
          .catch((err) => console.error('Impossible de recharger la hiérarchie :', err));
        apiService
          .getAffectations()
          .then((data) => setAssignments(data))
          .catch((err) => console.error('Impossible de recharger les affectations :', err));
      })
      .catch((err) => console.error('Échec de la création du partenaire :', err));
  };

  const handleEditPartner = (partnerId: string) => {
    const partner = hierarchyData.da.find((da) => da.id === partnerId);
    if (!partner) return;

    const nextName = window.prompt('Nouveau nom du partenaire', partner.nom);
    if (!nextName?.trim()) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.map((da) => (da.id === partnerId ? { ...da, nom: nextName.trim() } : da)),
    }));
  };

  const handleDeletePartner = (partnerId: string) => {
    const partner = hierarchyData.da.find((da) => da.id === partnerId);
    if (!partner) return;

    const confirmed = window.confirm(`Supprimer le partenaire "${partner.nom}" ?`);
    if (!confirmed) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.filter((da) => da.id !== partnerId),
    }));
  };

  const handleAddDSM = (daId: string) => {
    if (!canAccessDA(daId)) return;

    const nom = window.prompt('Nom du DSM à ajouter');
    if (!nom?.trim()) return;

    setHierarchyData((tree) =>
      addDSM(tree, daId, { id: String(Date.now()), nom: nom.trim(), pos: [] }),
    );
  };

  const handleEditDSM = (dsmId: string) => {
    const parentDA = hierarchyData.da.find((da) => da.dsm.some((dsm) => dsm.id === dsmId));
    if (!parentDA || !canAccessDA(parentDA.id)) return;

    const dsm = parentDA.dsm.find((item) => item.id === dsmId);
    if (!dsm) return;

    const nextName = window.prompt('Nouveau nom du DSM', dsm.nom);
    if (!nextName?.trim()) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.map((da) => ({
        ...da,
        dsm: da.dsm.map((item) =>
          item.id === dsmId ? { ...item, nom: nextName.trim() } : item,
        ),
      })),
    }));
  };

  const handleDeleteDSM = (dsmId: string) => {
    const parentDA = hierarchyData.da.find((da) => da.dsm.some((dsm) => dsm.id === dsmId));
    if (!parentDA || !canAccessDA(parentDA.id)) return;

    const dsm = parentDA.dsm.find((item) => item.id === dsmId);
    if (!dsm) return;

    const confirmed = window.confirm(`Supprimer le DSM "${dsm.nom}" ?`);
    if (!confirmed) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.map((da) => ({
        ...da,
        dsm: da.dsm.filter((item) => item.id !== dsmId),
      })),
    }));
  };

  const handleAddPOS = (dsmId: string) => {
    const parentDA = hierarchyData.da.find((da) =>
      da.dsm.some((dsm) => dsm.id === dsmId),
    );
    if (!parentDA || !canAccessDA(parentDA.id)) return;

    const nom = window.prompt('Nom du POS à ajouter');
    if (!nom?.trim()) return;

    setHierarchyData((tree) => addPOS(tree, dsmId, { id: String(Date.now()), nom: nom.trim() }));
  };

  const handleEditPOS = (posId: string) => {
    const parentDA = hierarchyData.da.find((da) =>
      da.dsm.some((dsm) => dsm.pos.some((pos) => pos.id === posId)),
    );
    const parentDSM = parentDA?.dsm.find((dsm) => dsm.pos.some((pos) => pos.id === posId));
    const pos = parentDSM?.pos.find((item) => item.id === posId);
    if (!parentDA || !parentDSM || !pos || !canAccessDA(parentDA.id)) return;

    const nextName = window.prompt('Nouveau nom du POS', pos.nom);
    if (!nextName?.trim()) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.map((da) => ({
        ...da,
        dsm: da.dsm.map((dsm) => ({
          ...dsm,
          pos: dsm.pos.map((item) =>
            item.id === posId ? { ...item, nom: nextName.trim() } : item,
          ),
        })),
      })),
    }));
  };

  const handleDeletePOS = (posId: string) => {
    const parentDA = hierarchyData.da.find((da) =>
      da.dsm.some((dsm) => dsm.pos.some((pos) => pos.id === posId)),
    );
    const parentDSM = parentDA?.dsm.find((dsm) => dsm.pos.some((pos) => pos.id === posId));
    const pos = parentDSM?.pos.find((item) => item.id === posId);
    if (!parentDA || !parentDSM || !pos || !canAccessDA(parentDA.id)) return;

    const confirmed = window.confirm(`Supprimer le POS "${pos.nom}" ?`);
    if (!confirmed) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.map((da) => ({
        ...da,
        dsm: da.dsm.map((dsm) => ({
          ...dsm,
          pos: dsm.pos.filter((item) => item.id !== posId),
        })),
      })),
    }));
  };

  const handleMovePOS = (posId: string) => {
    const dsms = listDSM(hierarchyData);
    if (dsms.length === 0) return;

    const target = window.prompt(
      `ID du DSM de destination:\n${dsms.map((dsm) => `${dsm.id} - ${dsm.label}`).join('\n')}`,
    );
    const targetDsmId = target?.trim();
    if (!targetDsmId || !dsms.some((dsm) => dsm.id === targetDsmId)) return;

    setHierarchyData((tree) => movePOS(tree, posId, targetDsmId));
  };

  const handleSubmitEntry = (payload: {
    entityId: string;
    date: string;
    stockJournalier: number;
    achat: number;
  }) => {
    // Envoi réel au backend : la saisie cible un POS précis, avec son stock
    // journalier réel (persisté dans la table `stock`, plus jamais perdu).
    apiService
      .postSaisie({
        id_pos: payload.entityId,
        date: payload.date,
        vente_jour: payload.achat,
        stock_journalier: payload.stockJournalier,
      })
      .then(() => {
        // On rafraîchit les KPI et l'historique de l'entité actuellement affichée
        // (pas forcément le POS visé par la saisie, si l'utilisateur regarde un DA/DSM).
        const currentType = selectedEntityType;
        const currentId = dashboardData.entite_id;

        apiService
          .getDashboard(currentType, currentId)
          .then((data) => setDashboardData(data))
          .catch((err) => console.error('Impossible de rafraîchir les KPI :', err));

        apiService
          .getRecords(currentType, currentId)
          .then((data) => setRecords(data as DailyRecord[]))
          .catch((err) => console.error("Impossible de rafraîchir l'historique :", err));
      })
      .catch((err) => console.error("Échec de l'enregistrement de la saisie :", err));

    setEntryModalOpen(false);
  };

  const { kpi } = dashboardData;
  const stockSecurite = (kpi.objectif_mensuel / daysInCurrentMonthFor(referenceDate)) * 3;

  // Agrégats réels du mois chargé (issues des relevés /records) pour les indicateurs de
  // progression : pas de valeur en dur, tout est recalculé à partir des données backend.
  const achatTotal = records.reduce((sum, record) => sum + (record.achat ?? 0), 0);
  const objectifTotalCalendrierAchat = records.reduce(
    (sum, record) => sum + (record.prevision_ca ?? 0),
    0,
  );

  const handleSaveForecasts = (
    posId: string,
    year: number,
    month: number,
    forecasts: Record<string, number>,
  ) => {
    // Conversion des clés jj/mm/aaaa (saisie utilisateur) vers aaaa-mm-jj (backend).
    const isoForecasts: Record<string, number> = {};
    Object.entries(forecasts).forEach(([dateKey, value]) => {
      const [day, mon, yr] = dateKey.split('/');
      isoForecasts[`${yr}-${mon}-${day}`] = value;
    });

    apiService
      .saveCalendrierAchat(posId, isoForecasts)
      .then(() => {
        const currentType = selectedEntityType;
        const currentId = dashboardData.entite_id;
        return apiService.getRecords(currentType, currentId, `${year}-${String(month).padStart(2, '0')}`);
      })
      .then((data) => setRecords(data as DailyRecord[]))
      .catch((err) => console.error("Échec de l'enregistrement du calendrier d'achat :", err));
  };

  const monthLabel = new Date(referenceDate).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const handleSaveObjective = (value: number) => {
    const currentType = selectedEntityType;
    const currentId = dashboardData.entite_id;

    // Mise à jour optimiste de l'affichage, puis persistance réelle en base.
    setDashboardData((prev) => ({
      ...prev,
      kpi: {
        ...prev.kpi,
        objectif_mensuel: value,
      },
    }));

    apiService
      .updateObjective(currentType, currentId, value)
      .then(() => apiService.getDashboard(currentType, currentId))
      .then((data) => setDashboardData(data))
      .catch((err) => console.error("Échec de l'enregistrement de l'objectif :", err));
  };

  const handleAssignmentChange = (updatedAssignment: OperationalAssignment) => {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.userId === updatedAssignment.userId ? updatedAssignment : assignment,
      ),
    );
    setAssignmentToEdit(null);
  };

  return (
    <div className={`flex min-h-screen font-sans ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {loadingHierarchy ? (
        <div className="flex w-72 items-center justify-center border-r border-slate-800/20 p-6 text-sm text-slate-400">
          Chargement de la hiérarchie…
        </div>
      ) : (
        <Sidebar
          hierarchyData={visibleHierarchy}
          role={role}
          onSelectEntity={handleSelectEntity}
          onAddPartner={handleAddPartner}
          onEditPartner={handleEditPartner}
          onDeletePartner={handleDeletePartner}
          onAddDSM={handleAddDSM}
          onEditDSM={handleEditDSM}
          onDeleteDSM={handleDeleteDSM}
          onAddPOS={handleAddPOS}
          onEditPOS={handleEditPOS}
          onDeletePOS={handleDeletePOS}
          onMovePOS={handleMovePOS}
          selectedEntityId={dashboardData.entite_id}
          isDark={isDark}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`flex h-16 items-center justify-between border-b px-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div>
            <h1 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{dashboardData.nom_entite}</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {canManageNetwork
                ? 'Gestion DSM/POS réservée au Chef opérationnel'
                : 'Vue opérationnelle et suivi journalier'}
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              {isDark ? 'Clair' : 'Sombre'}
            </button>

            <input
              type="date"
              value={referenceDate}
              onChange={(event) => setReferenceDate(event.target.value)}
              className={`rounded-lg border px-3 py-2 text-xs ${
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
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
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

        <main className="space-y-6 overflow-y-auto p-6">
          <RoleWorkspace
            role={role}
            user={user}
            operationnels={operationnels}
            assignments={assignments}
            partners={hierarchyData.da}
          />

          {/* Bannière d'alerte dynamique */}
          {dashboardData?.kpi?.statut_alerte && dashboardData.kpi.statut_alerte !== 'NORMAL' ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-white">! ALERTE</span>
              <p className="flex-1 font-medium">
                {dashboardData.nom_entite ? `${dashboardData.nom_entite} est sous surveillance.` : 'Une entité est sous surveillance.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/modifications')}
                className="font-bold text-rose-700 underline underline-offset-2"
              >
                Voir détails →
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
              <p className="font-medium">
                {dashboardData?.nom_entite 
                  ? `Statut de ${dashboardData.nom_entite} : Normal` 
                  : 'Sélectionnez une entité pour afficher les alertes.'}
              </p>
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
                  Modifier l’objectif →
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
            canCreateEntry={canCreateEntry}
            onNewEntry={() => setEntryModalOpen(true)}
            canCreateForecast={canCreateForecast}
            onNewForecast={() => setForecastModalOpen(true)}
            isDark={isDark}
            stockSecurite={stockSecurite}
          />
        </main>
      </div>

      {entryModalOpen && (
        <EntryModal
          defaultDate={referenceDate}
          hierarchyData={visibleHierarchy}
          onClose={() => setEntryModalOpen(false)}
          onSubmit={handleSubmitEntry}
        />
      )}

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
        defaultPosId={selectedEntityType === 'POS' ? dashboardData.entite_id : undefined}
        onClose={() => setForecastModalOpen(false)}
        onSave={handleSaveForecasts}
        onLoadExisting={(posId, year, month) => apiService.getCalendrierAchat(posId, year, month)}
        isDark={isDark}
      />

      {assignmentToEdit && (
        <AssignmentModal
          assignment={assignmentToEdit}
          partners={hierarchyData.da}
          onClose={() => setAssignmentToEdit(null)}
          onSubmit={handleAssignmentChange}
        />
      )}

      <AddPartnerModal
        isOpen={addPartnerModalOpen}
        operationnels={operationnels}
        onClose={() => setAddPartnerModalOpen(false)}
        onSubmit={handleCreatePartner}
      />
    </div>
  );
};
