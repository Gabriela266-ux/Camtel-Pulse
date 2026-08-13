import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { DailyTrackingTable } from '../components/dashboard/DailyTrackingTable';
import { EntryModal } from '../components/dashboard/EntryModal';
import { mockHierarchyData, mockDashboardInitial, mockDailyRecords } from '../data/mockHierarchy';
import type { CentreHierarchy, DailyRecord, DashboardData, DSMNode, EntitySelection, POSNode } from '../types';
import { useAuth } from '../auth/AuthContext';

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

const RoleWorkspace: React.FC<{ role: string }> = ({ role }) => {
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
        'Accès limité au partenaire affecté, avec saisie du stock journalier et de la Réalisation/VA(U).',
      scope: 'Partenaire affecté - Glotelho',
      border: 'border-l-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      cards: [
        ['Périmètre', 'Glotelho', 'Saisie limitée au partenaire affecté'],
        ['Réalisation', 'À saisir', 'Vente du jour et suivi de correction'],
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
          {[
            { name: 'M. Atangana', partner: 'Glotelho' },
            { name: 'Mme Ngono', partner: 'Master Color' },
          ].map((operational) => (
            <article
              key={operational.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3"
            >
              <div>
                <p className="text-xs font-black text-slate-800">{operational.name}</p>
                <p className="mt-1 text-xs text-slate-500">Gère le partenaire {operational.partner}</p>
              </div>

              <button
                type="button"
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

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hierarchyData, setHierarchyData] = useState<CentreHierarchy>(mockHierarchyData);
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardInitial);
  const [records, setRecords] = useState<DailyRecord[]>(mockDailyRecords);
  const [referenceDate, setReferenceDate] = useState('2026-08-11');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const role = user?.role ?? 'OPERATIONNEL';
  const canCreateEntry = role === 'OPERATIONNEL';

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

  const handleAddDSM = (daId: number) => {
    if (!canAccessDA(daId)) return;

    const nom = window.prompt('Nom du DSM à ajouter');
    if (!nom?.trim()) return;

    setHierarchyData((tree) =>
      addDSM(tree, daId, { id: Date.now(), nom: nom.trim(), pos: [] }),
    );
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
    realisationVa: number;
  }) => {
    const lastCumul = records.at(-1)?.cumul_achat ?? 0;
    const prevision = 850;
    const ecartJour = payload.realisationVa - prevision;
    const nextRecord: DailyRecord = {
      date: payload.date,
      prevision_ca: prevision,
      stock_journalier: payload.stockJournalier,
      realisation_va: payload.realisationVa,
      cumul_achat: lastCumul + payload.realisationVa,
      ecart_stock_sec: payload.stockJournalier,
      ecart_jour: ecartJour,
      ecart_cumule: (records.at(-1)?.ecart_cumule ?? 0) + ecartJour,
      statut: ecartJour >= 0 ? 'NORMAL' : 'CRITIQUE',
    };

    setRecords((prev) => [...prev.filter((record) => record.date !== payload.date), nextRecord]);
    setEntryModalOpen(false);
  };

  const { kpi } = dashboardData;

  // Removed automatic redirect for ADMIN users so they stay on Dashboard first.

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        hierarchyData={visibleHierarchy}
        role={role}
        onSelectEntity={handleSelectEntity}
        onAddDSM={handleAddDSM}
        onAddPOS={handleAddPOS}
        onMovePOS={handleMovePOS}
        selectedEntityId={dashboardData.entite_id}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h1 className="text-lg font-black text-slate-800">{dashboardData.nom_entite}</h1>
            <p className="text-xs text-slate-500">
              {canManageNetwork
                ? 'Gestion DSM/POS réservée au Chef opérationnel'
                : 'Vue opérationnelle et suivi journalier'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={referenceDate}
              onChange={(event) => setReferenceDate(event.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            />
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className="rounded-lg px-3 py-2 bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100"
                title="Aller à l'espace administrateur"
              >
                Espace Admin
              </button>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {user?.nom_complet} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="space-y-6 overflow-y-auto p-6">
          <RoleWorkspace role={role} />

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-white">! ALERTE</span>
            <p className="flex-1 font-medium">
              Master Color est sous surveillance aujourd&apos;hui. Ajoutez les DSM puis les POS pour détailler les alertes terrain.
            </p>
            {canManageNetwork && (
              <button type="button" className="font-bold text-rose-700 underline underline-offset-2">
                Voir détails →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-500">Objectif mensuel</div>
              <div className="mt-2 text-2xl font-black text-slate-800">
                {kpi.objectif_mensuel.toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-500">Réalisé cumulé</div>
              <div className="mt-2 text-2xl font-black text-sky-600">
                {kpi.realise_cumule.toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="text-xs font-bold uppercase text-slate-500">Statut réseau</div>
                <div
                  className={`mt-2 flex items-center gap-1.5 text-lg font-black ${
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

          <DailyTrackingTable
            records={records}
            canCreateEntry={canCreateEntry}
            onNewEntry={() => setEntryModalOpen(true)}
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
    </div>
  );
};
