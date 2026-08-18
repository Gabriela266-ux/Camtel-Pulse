import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, CheckCircle2, Moon, SunMedium } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { DailyTrackingTable } from '../components/dashboard/DailyTrackingTable';
import { EntryModal } from '../components/dashboard/EntryModal';
import { ForecastModal } from '../components/dashboard/ForecastModal';
import { ObjectiveModal } from '../components/dashboard/ObjectiveModal';
import { AssignmentModal } from '../components/dashboard/AssignmentModal';
import { mockHierarchyData, mockDashboardInitial, mockDailyRecords } from '../data/mockHierarchy';
import { ProgressIndicators } from '../components/dashboard/ProgressIndicators';
import type {
  CentreHierarchy,
  DailyRecord,
  DashboardData,
  DSMNode,
  EntitySelection,
  OperationalAssignment,
  POSNode,
} from '../types';
import { useAuth } from '../auth/AuthContext';
import { ConsumptionChart } from '../components/dashboard/ConsumptionChart';

interface DashboardPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

function addDSM(tree: CentreHierarchy, daId: number, dsm: DSMNode): CentreHierarchy {
  return {
    ...tree,
    da: tree.da.map((da) => (da.id === daId ? { ...da, dsm: [...da.dsm, dsm] } : da)),
  };
}

function addPOS(tree: CentreHierarchy, dsmId: number, pos: POSNode): CentreHierarchy {
  return {
    ...tree,
    da: tree.da.map((da) => ({
      ...da,
      dsm: da.dsm.map((dsm) => (dsm.id === dsmId ? { ...dsm, pos: [...dsm.pos, pos] } : dsm)),
    })),
  };
}

function movePOS(tree: CentreHierarchy, posId: number, targetDsmId: number): CentreHierarchy {
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

const RoleWorkspace: React.FC<{
  role: string;
  assignments?: OperationalAssignment[];
  onEditAssignment?: (assignment: OperationalAssignment) => void;
}> = ({ role, assignments = [], onEditAssignment }) => {
  const configs = {
    ADMIN: {
      title: 'Console d’administration',
      label: 'Administrateur',
      description:
        'Gestion utilisateurs, réseau, imports, objectifs, audit et actions techniques.',
      scope: 'Accès complet CPDSM 1',
      border: 'border-l-sky-600',
      badge: 'bg-sky-100 text-sky-600',
      cards: [
        ['Utilisateurs', '18 actifs', 'Demandes à valider sous 72 h'],
        ['Réseau POS', '2 actions', 'Réaffectation POS, fusion DSM'],
        ['Audit', '143 traces', 'Imports, objectifs, accès sensibles'],
      ],
    },
    MANAGER: {
      title: 'Vue de pilotage manager',
      label: 'Manager',
      description: 'Restitution, alertes, graphiques et historique en lecture seule.',
      scope: 'Lecture seule sur tous les indicateurs',
      border: 'border-l-slate-600',
      badge: 'bg-slate-100 text-slate-600',
      cards: [
        ['Restitution', 'Lecture seule', 'Aucune saisie ni modification autorisée'],
        ['Alertes', '4 signaux', 'Vue consolidée pour décision'],
        ['Exports', 'XLS / PDF', 'Reporting et réunion de pilotage'],
      ],
    },
    CHEF_OPE: {
      title: 'Suivi opérationnel du centre',
      label: 'Chef opérationnel',
      description:
        'Supervision des DAs, affectation des opérationnels et validation des corrections.',
      scope: 'CPDSM 1 - Glotelho et Master Color',
      border: 'border-l-violet-600',
      badge: 'bg-violet-100 text-violet-600',
      cards: [
        ['Corrections', '3 en attente', 'Validation Chef opérationnel sous 48 h'],
        ['Opérationnels', '6 affectés', 'Glotelho et Master Color'],
        ['Alertes terrain', '2 critiques', "POS à suivre aujourd’hui"],
      ],
    },
    OPERATIONNEL: {
      title: 'Saisie et suivi du périmètre affecté',
      label: 'Opérationnel',
      description:
        'Accès limité au partenaire affecté, avec saisie du stock journalier et de l\'Achat (U).',
      scope: 'Partenaire affecté - Glotelho',
      border: 'border-l-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      cards: [
        ['Périmètre', 'Glotelho', 'Saisie limitée au partenaire affecté'],
        ['Achat', 'À saisir', 'Achat du jour et suivi de correction'],
        ['Corrections', '2/5', 'Au-delà, demande validée par le chef'],
      ],
    },
  };

  const config = configs[role as keyof typeof configs] ?? configs.OPERATIONNEL;

  return (
    <section
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${config.border}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900">{config.title}</h2>

            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.badge}`}>
              {config.label}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">{config.description}</p>
        </div>

        <span className="text-xs text-slate-400">{config.scope}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {config.cards.map(([title, value, description]) => (
          <article
            key={title}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
            <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </article>
        ))}
      </div>

      {role === 'CHEF_OPE' && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {assignments.map((operational) => (
            <article
              key={operational.userId}
              className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3"
            >
              <div>
                <p className="text-xs font-black text-slate-800">{operational.nomComplet}</p>
                <p className="mt-1 text-xs text-slate-500">Gère le partenaire {operational.partenaireNom}</p>
              </div>

              <button
                type="button"
                onClick={() => onEditAssignment?.(operational)}
                className="rounded-lg border border-violet-300 bg-violet-100 px-3 py-2 text-xs font-bold text-violet-600 hover:bg-violet-200"
              >
                Changer poste
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ isDark, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hierarchyData, setHierarchyData] = useState<CentreHierarchy>(mockHierarchyData);
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardInitial);
  const [records, setRecords] = useState<DailyRecord[]>(mockDailyRecords);
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false);
  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<OperationalAssignment[]>([]);
  const [assignmentToEdit, setAssignmentToEdit] = useState<OperationalAssignment | null>(null);

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

  const canAccessDA = (daId: number) => role !== 'OPERATIONNEL' || user?.partenaireId === daId;

  const handleSelectEntity = (entity: EntitySelection) => {
    setDashboardData((prev) => ({
      ...prev,
      entite_id: entity.id,
      nom_entite: entity.nom,
    }));
  };

  const handleAddPartner = () => {
    const nom = window.prompt('Nom du partenaire à ajouter');
    if (!nom?.trim()) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: [...tree.da, { id: Date.now(), nom: nom.trim(), dsm: [] }],
    }));
  };

  const handleEditPartner = (partnerId: number) => {
    const partner = hierarchyData.da.find((da) => da.id === partnerId);
    if (!partner) return;

    const nextName = window.prompt('Nouveau nom du partenaire', partner.nom);
    if (!nextName?.trim()) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.map((da) => (da.id === partnerId ? { ...da, nom: nextName.trim() } : da)),
    }));
  };

  const handleDeletePartner = (partnerId: number) => {
    const partner = hierarchyData.da.find((da) => da.id === partnerId);
    if (!partner) return;

    const confirmed = window.confirm(`Supprimer le partenaire "${partner.nom}" ?`);
    if (!confirmed) return;

    setHierarchyData((tree) => ({
      ...tree,
      da: tree.da.filter((da) => da.id !== partnerId),
    }));
  };

  const handleAddDSM = (daId: number) => {
    if (!canAccessDA(daId)) return;

    const nom = window.prompt('Nom du DSM à ajouter');
    if (!nom?.trim()) return;

    setHierarchyData((tree) =>
      addDSM(tree, daId, { id: Date.now(), nom: nom.trim(), pos: [] }),
    );
  };

  const handleEditDSM = (dsmId: number) => {
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

  const handleDeleteDSM = (dsmId: number) => {
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

  const handleAddPOS = (dsmId: number) => {
    const parentDA = hierarchyData.da.find((da) =>
      da.dsm.some((dsm) => dsm.id === dsmId),
    );
    if (!parentDA || !canAccessDA(parentDA.id)) return;

    const nom = window.prompt('Nom du POS à ajouter');
    if (!nom?.trim()) return;

    setHierarchyData((tree) => addPOS(tree, dsmId, { id: Date.now(), nom: nom.trim() }));
  };

  const handleEditPOS = (posId: number) => {
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

  const handleDeletePOS = (posId: number) => {
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

  const handleMovePOS = (posId: number) => {
    const dsms = listDSM(hierarchyData);
    if (dsms.length === 0) return;

    const target = window.prompt(
      `ID du DSM de destination:\n${dsms.map((dsm) => `${dsm.id} - ${dsm.label}`).join('\n')}`,
    );
    const targetDsmId = Number(target);
    if (!targetDsmId || !dsms.some((dsm) => dsm.id === targetDsmId)) return;

    setHierarchyData((tree) => movePOS(tree, posId, targetDsmId));
  };

  const handleSubmitEntry = (payload: {
    entityId: number;
    date: string;
    stockJournalier: number;
    achat: number;
  }) => {
    const year = Number(payload.date.slice(0, 4));
    const month = Number(payload.date.slice(5, 7));
    const daysInMonth = new Date(year, month, 0).getDate();
    const stockSecurite = (dashboardData.kpi.objectif_mensuel / daysInMonth) * 3;

    setRecords((prev) => {
      const monthKey = payload.date.slice(0, 7);
      const sorted = [...prev.filter((record) => record.date !== payload.date)].sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      const updatedRecord: DailyRecord = {
        date: payload.date,
        prevision_ca: sorted.find((record) => record.date === payload.date)?.prevision_ca ?? 0,
        achat: payload.achat,
        stock_journalier: payload.stockJournalier,
        cumul_achat: 0,
        consommation: 0,
        ecart_jour: 0,
        ecart_cumule: 0,
        statut: 'NORMAL',
      };

      sorted.push(updatedRecord);
      sorted.sort((a, b) => a.date.localeCompare(b.date));

      const monthRecords = sorted.filter((record) => record.date.startsWith(monthKey));
      let cumulAchat = 0;

      const recalculated = monthRecords.map((record, index, monthList) => {
        const nextRecord = monthList[index + 1];
        cumulAchat += record.achat;
        const consommation = record.stock_journalier + record.achat - (nextRecord?.stock_journalier ?? 0);
        const ecartJour = record.stock_journalier - stockSecurite;

        return {
          ...record,
          cumul_achat: cumulAchat,
          consommation: Number.isFinite(consommation) ? consommation : 0,
          ecart_jour: ecartJour,
          statut: ecartJour >= 0 ? 'NORMAL' : 'CRITIQUE',
        } as DailyRecord;
      });

      const recalculatedMap = new Map(recalculated.map((record) => [record.date, record]));

      return sorted.map((record) =>
        record.date.startsWith(monthKey) ? recalculatedMap.get(record.date) ?? record : record,
      );
    });

    setEntryModalOpen(false);
  };

  const { kpi } = dashboardData;
  const activeMonthKey = referenceDate.slice(0, 7);
  const objectiveMonth = new Date(referenceDate).getMonth() + 1;
  const objectiveYear = new Date(referenceDate).getFullYear();
  const daysInCurrentMonth = new Date(objectiveYear, objectiveMonth, 0).getDate();
  const stockSecurite = (kpi.objectif_mensuel / daysInCurrentMonth) * 3;
  const consommationMensuelle = records
    .filter((record) => record.date.startsWith(activeMonthKey) && record.consommation !== null)
    .reduce((sum, record) => sum + (record.consommation ?? 0), 0);

  const handleSaveForecasts = (
    year: number,
    month: number,
    forecasts: Record<string, number>,
  ) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();

    setRecords((prev) => {
      const nextRows: DailyRecord[] = [];
      const monthRecords = prev.filter((record) => record.date.slice(0, 7) === monthKey);
      const existingByDate = new Map(monthRecords.map((record) => [record.date, record]));

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const existing = existingByDate.get(date);
        const dateKey = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

        nextRows.push({
          date,
          prevision_ca: forecasts[dateKey] ?? existing?.prevision_ca ?? 0,
          achat: existing?.achat ?? 0,
          stock_journalier: existing?.stock_journalier ?? 0,
          cumul_achat: existing?.cumul_achat ?? 0,
          consommation: existing?.consommation ?? 0,
          ecart_jour: existing?.ecart_jour ?? 0,
          ecart_cumule: existing?.ecart_cumule ?? 0,
          statut: existing?.statut ?? 'NORMAL',
        });
      }

      const otherRows = prev.filter((record) => record.date.slice(0, 7) !== monthKey);
      return [...otherRows, ...nextRows].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const monthLabel = new Date(referenceDate).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const handleSaveObjective = (value: number) => {
    setDashboardData((prev) => ({
      ...prev,
      kpi: {
        ...prev.kpi,
        objectif_mensuel: value,
      },
    }));
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
            assignments={assignments}
            onEditAssignment={setAssignmentToEdit}
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
                {consommationMensuelle.toLocaleString('fr-FR')} U
              </div>
            </div>
              
            <div className="panel-card flex items-center justify-between p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">Statut réseau</div>
                <div
                  className={`mt-3 flex items-center gap-1.5 text-lg font-black ${
                    kpi.statut_alerte === 'CRITIQUE' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {kpi.statut_alerte === 'CRITIQUE' ? (
                    <>
                      <AlertTriangle className="h-5 w-5" /> Critique
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Normal
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <ConsumptionChart
              records={records}
              stockSecurite={stockSecurite}
              isDark={isDark}
            />

            <ProgressIndicators
              realizationRate={0}
              weeklyAverageStock={0}
            />
          </div>

          <DailyTrackingTable
            records={records}
            canCreateEntry={canCreateEntry}
            onNewEntry={() => setEntryModalOpen(true)}
            canCreateForecast={canCreateForecast}
            onNewForecast={() => setForecastModalOpen(true)}
            isDark={isDark}
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
        onClose={() => setForecastModalOpen(false)}
        onSave={handleSaveForecasts}
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
    </div>
  );
};