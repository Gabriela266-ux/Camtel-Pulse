import React, { useRef, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Package,
  Plus,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { mockHierarchyData, mockDashboardInitial } from '../data/mockHierarchy';
import type { POSNode, DashboardData, CentreHierarchy, DSMNode } from '../types';
import { useAuth } from '../auth/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canManageHierarchy = user?.role === 'CHEF_OPE';
  const canModifyDailyFollowUp = user?.role === 'CHEF_OPE';

  const [hierarchyData, setHierarchyData] = useState<CentreHierarchy>(mockHierarchyData);
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardInitial);
  const [tableData, setTableData] = useState<string[][]>([
    ['11/08/2026', '940 U', '730 U', '2 780 U', '195 U', '-210 U', '-205 U', 'Critique'],
    ['10/08/2026', '780 U', '820 U', '2 710 U', '250 U', '+40 U', '-139 U', 'Normal'],
    ['09/08/2026', '860 U', '900 U', '2 610 U', '210 U', '+40 U', '-34 U', 'Normal'],
    ['08/08/2026', '842 U', '790 U', '2 512 U', '320 U', '-52 U', '-12 U', 'Normal'],
    ['07/08/2026', '910 U', '899 U', '2 500 U', '215 U', '-11 U', '+49 U', 'Normal'],
  ]);
  const nextNodeId = useRef(5000);

  const getNextNodeId = () => {
    nextNodeId.current += 1;
    return nextNodeId.current;
  };

  const handleSelectPOS = (pos: POSNode) => {
    const target = hierarchyData.da
      .flatMap((da) => da.dsm.map((dsm) => ({ da, dsm })))
      .find(({ dsm }) => dsm.pos.some((item) => item.id === pos.id));

    if (!target) {
      setDashboardData((prev) => ({
        ...prev,
        entite_id: pos.id,
        nom_entite: pos.nom,
        entite_type: 'POS',
        breadcrumb: `${hierarchyData.nom} / ${pos.nom}`,
      }));
      return;
    }

    setDashboardData((prev) => ({
      ...prev,
      entite_id: pos.id,
      nom_entite: pos.nom,
      entite_type: 'POS',
      breadcrumb: `${hierarchyData.nom} / ${target.da.nom} / ${target.dsm.nom} / ${pos.nom}`,
    }));
  };

  const handleSelectDSM = (dsm: { id: number; nom: string }) => {
    const target = hierarchyData.da.find((da) => da.dsm.some((node) => node.id === dsm.id));

    if (!target) {
      setDashboardData((prev) => ({
        ...prev,
        entite_id: dsm.id,
        nom_entite: dsm.nom,
        entite_type: 'DSM',
        breadcrumb: `${hierarchyData.nom} / ${dsm.nom}`,
      }));
      return;
    }

    setDashboardData((prev) => ({
      ...prev,
      entite_id: dsm.id,
      nom_entite: dsm.nom,
      entite_type: 'DSM',
      breadcrumb: `${hierarchyData.nom} / ${target.nom} / ${dsm.nom}`,
    }));
  };

  const handleSelectDA = (da: { id: number; nom: string }) => {
    setDashboardData((prev) => ({
      ...prev,
      entite_id: da.id,
      nom_entite: da.nom,
      entite_type: 'DA',
      breadcrumb: `${hierarchyData.nom} / ${da.nom}`,
    }));
  };

  const handleAddDSM = (daId: number) => {
    const dsmName = window.prompt('Nom du DSM à créer', 'DSM - Nouveau Site');
    if (!dsmName || !dsmName.trim()) return;

    const newDSM: DSMNode = {
      id: getNextNodeId(),
      nom: dsmName.trim(),
      pos: [],
    };

    setHierarchyData((prev) => ({
      ...prev,
      da: prev.da.map((da) =>
        da.id === daId
          ? {
              ...da,
              dsm: [...da.dsm, newDSM],
            }
          : da
      ),
    }));
  };

  const handleAddPOS = (dsmId: number) => {
    const posName = window.prompt('Nom du POS à créer', 'POS - Nouveau Point');
    if (!posName || !posName.trim()) return;

    const newPos: POSNode = {
      id: getNextNodeId(),
      nom: posName.trim(),
    };

    setHierarchyData((prev) => ({
      ...prev,
      da: prev.da.map((da) => ({
        ...da,
        dsm: da.dsm.map((dsm) =>
          dsm.id === dsmId
            ? {
                ...dsm,
                pos: [...dsm.pos, newPos],
              }
            : dsm
        ),
      })),
    }));
  };

  const handleEditDSM = (dsmId: number) => {
    const dsm = hierarchyData.da
      .flatMap((da) => da.dsm)
      .find((item) => item.id === dsmId);

    if (!dsm) return;

    const newName = window.prompt('Renommer le DSM', dsm.nom);
    if (!newName || !newName.trim()) return;

    setHierarchyData((prev) => ({
      ...prev,
      da: prev.da.map((da) => ({
        ...da,
        dsm: da.dsm.map((node) =>
          node.id === dsmId
            ? {
                ...node,
                nom: newName.trim(),
              }
            : node
        ),
      })),
    }));
  };

  const handleEditPOS = (posId: number) => {
    const pos = hierarchyData.da
      .flatMap((da) => da.dsm)
      .flatMap((dsm) => dsm.pos)
      .find((item) => item.id === posId);

    if (!pos) return;

    const newName = window.prompt('Renommer le POS', pos.nom);
    if (!newName || !newName.trim()) return;

    setHierarchyData((prev) => ({
      ...prev,
      da: prev.da.map((da) => ({
        ...da,
        dsm: da.dsm.map((dsm) => ({
          ...dsm,
          pos: dsm.pos.map((node) =>
            node.id === posId
              ? {
                  ...node,
                  nom: newName.trim(),
                }
              : node
          ),
        })),
      })),
    }));
  };

  const handleRemoveDSM = (dsmId: number) => {
    if (!window.confirm('Voulez-vous supprimer ce DSM et ses POS associés ?')) return;

    setHierarchyData((prev) => ({
      ...prev,
      da: prev.da.map((da) => ({
        ...da,
        dsm: da.dsm.filter((dsm) => dsm.id !== dsmId),
      })),
    }));
  };

  const handleRemovePOS = (posId: number) => {
    if (!window.confirm('Voulez-vous supprimer ce POS ?')) return;

    setHierarchyData((prev) => ({
      ...prev,
      da: prev.da.map((da) => ({
        ...da,
        dsm: da.dsm.map((dsm) => ({
          ...dsm,
          pos: dsm.pos.filter((pos) => pos.id !== posId),
        })),
      })),
    }));
  };

  const snapshotKpiData = [
    {
      label: 'Vente du Jour',
      icon: ShoppingCart,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      value: '1 240',
      unit: 'U',
      delta: '+140 U',
      deltaClass: 'text-emerald-700 bg-emerald-50',
      progress: 68,
      objective: 'Objectif : 1 825 U',
      fill: 'bg-sky-600',
    },
    {
      label: 'Achats Cumulés',
      icon: Package,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      value: '3 640',
      unit: 'U',
      delta: '+192 U',
      deltaClass: 'text-emerald-700 bg-emerald-50',
      progress: 74,
      objective: 'Objectif : 4 720 U',
      fill: 'bg-violet-600',
    },
    {
      label: 'Stock de Sécurité',
      icon: Package,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      value: '520',
      unit: 'U',
      delta: '-36 U',
      deltaClass: 'text-rose-700 bg-rose-50',
      progress: 47,
      objective: 'Objectif : 910 U',
      fill: 'bg-rose-500',
    },
    {
      label: 'Écart Journalier',
      icon: TrendingDown,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      value: '-210',
      unit: 'U',
      delta: '-210 U',
      deltaClass: 'text-rose-700 bg-rose-50',
      progress: 0,
      objective: '',
      fill: 'bg-rose-600',
    },
    {
      label: 'Écart Cumulé',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      value: '-205',
      unit: 'U',
      delta: '-205 U',
      deltaClass: 'text-rose-700 bg-rose-50',
      progress: 0,
      objective: '',
      fill: 'bg-emerald-600',
    },
  ];

  const kpiData = isManager
    ? snapshotKpiData
    : [
        {
          label: 'Vente du Jour',
          icon: ShoppingCart,
          iconBg: 'bg-sky-50',
          iconColor: 'text-sky-600',
          value: `${Math.round(dashboardData.kpi.realise_cumule / 1000)}`,
          unit: 'U',
          delta: `${dashboardData.kpi.ecart_jour >= 0 ? '+' : ''}${dashboardData.kpi.ecart_jour} U`,
          deltaClass: dashboardData.kpi.ecart_jour >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50',
          progress: 66,
          objective: `Objectif : ${Math.round(dashboardData.kpi.objectif_mensuel / 1000)} U`,
          fill: 'bg-sky-600',
        },
        {
          label: 'Achats Cumulés',
          icon: Package,
          iconBg: 'bg-violet-50',
          iconColor: 'text-violet-600',
          value: `${Math.round(dashboardData.kpi.realise_cumule / 1000)}`,
          unit: 'U',
          delta: `${dashboardData.kpi.ecart_cumule >= 0 ? '+' : ''}${dashboardData.kpi.ecart_cumule} U`,
          deltaClass: dashboardData.kpi.ecart_cumule >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50',
          progress: 70,
          objective: `Objectif : ${Math.round(dashboardData.kpi.objectif_mensuel / 1000)} U`,
          fill: 'bg-violet-600',
        },
        {
          label: 'Stock de Sécurité',
          icon: Package,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          value: `${Math.round(dashboardData.kpi.stock_securite / 1000)}`,
          unit: 'U',
          delta: `${dashboardData.kpi.stock_securite >= 0 ? '+' : ''}${dashboardData.kpi.stock_securite} U`,
          deltaClass: 'text-emerald-700 bg-emerald-50',
          progress: 55,
          objective: `Objectif : ${Math.round(dashboardData.kpi.stock_securite / 600)} U`,
          fill: 'bg-rose-500',
        },
        {
          label: 'Écart Journalier',
          icon: TrendingDown,
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-600',
          value: `${dashboardData.kpi.ecart_jour}`,
          unit: 'U',
          delta: `${dashboardData.kpi.ecart_jour} U`,
          deltaClass: dashboardData.kpi.ecart_jour >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50',
          progress: 0,
          objective: '',
          fill: 'bg-rose-600',
        },
        {
          label: 'Écart Cumulé',
          icon: TrendingUp,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          value: `${dashboardData.kpi.ecart_cumule}`,
          unit: 'U',
          delta: `${dashboardData.kpi.ecart_cumule} U`,
          deltaClass: dashboardData.kpi.ecart_cumule >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50',
          progress: 0,
          objective: '',
          fill: 'bg-emerald-600'
        },
      ];

  const lineData = [
    { date: '05/08', value: 40 },
    { date: '06/08', value: 86 },
    { date: '07/08', value: 67 },
    { date: '08/08', value: 98 },
    { date: '09/08', value: 54 },
    { date: '10/08', value: 77 },
    { date: '11/08', value: 93 },
  ];

  const handleTableCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setTableData((prev) =>
      prev.map((row, idx) => {
        if (idx !== rowIndex) return row;

        return row.map((cell, col) => (col === colIndex ? value : cell));
      })
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        hierarchyData={hierarchyData}
        onSelectPOS={handleSelectPOS}
        onSelectDSM={handleSelectDSM}
        onSelectDA={handleSelectDA}
        selectedPosId={dashboardData.entite_id}
        canManageHierarchy={canManageHierarchy}
        onAddDSM={handleAddDSM}
        onAddPOS={handleAddPOS}
        onEditDSM={handleEditDSM}
        onEditPOS={handleEditPOS}
        onRemoveDSM={handleRemoveDSM}
        onRemovePOS={handleRemovePOS}
      />

      <div className="flex-1 min-w-0 bg-slate-50 p-6">
        <div className="max-w-[1600px] mx-auto space-y-5">
          <header className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 tracking-wide">
                  {dashboardData.breadcrumb}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900 leading-none">
                    {dashboardData.nom_entite}
                  </h1>
                  <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-[11px] font-bold border border-blue-200">
                    {dashboardData.entite_type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Référence</span>
                  <span className="text-sm font-bold text-slate-900">11/08/2026</span>
                </div>

                <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Saisie Journalière
                </button>

                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                  AD
                </div>
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black text-white">
                ! ALERTE
              </span>
              <div className="text-sm font-semibold text-rose-900">
                2 POS en statut CRITIQUE aujourd'hui — <span className="font-black">POS Akwa 02</span>, <span className="font-black">POS Bonabéri 01</span>. Écart cumulé : -205 U.
              </div>
            </div>
            <a href="#" className="text-sm font-bold text-rose-700 underline">
              Voir détails <ChevronRight className="inline w-4 h-4" />
            </a>
          </section>

          <section className="grid grid-cols-5 gap-4">
            {kpiData.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <article key={kpi.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-h-[170px]">
                  <div className="flex items-center justify-between">
                    <span className={`w-10 h-10 ${kpi.iconBg} ${kpi.iconColor} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className={`text-[11px] font-bold rounded-full px-2 py-1 ${kpi.deltaClass}`}>{kpi.delta}</span>
                  </div>
                  <div className="mt-5">
                    <div className="text-xs font-bold uppercase text-slate-500">
                      {kpi.label}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 leading-none">{kpi.value}</span>
                      <span className="text-xs font-bold text-slate-500">{kpi.unit}</span>
                    </div>
                  </div>

                  {index < 3 && (
                    <div className="mt-5">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${kpi.fill} rounded-full`} style={{ width: `${kpi.progress}%` }}></div>
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500">
                        <span>{kpi.objective}</span>
                        <span className="text-slate-900">{kpi.progress}%</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <section className="grid grid-cols-2 gap-4">
            <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-900">Progression Objectifs</h2>
                <span className="text-xs font-bold text-slate-500">11 août 2026</span>
              </div>

              {[
                ['Seuil du Jour vs Réalisé', '1 140 / 1 680 U', '64%', 'bg-rose-500'],
                ['Achats Cumulés', '2 875 / 3 900 U', '74%', 'bg-sky-500'],
                ['Stock Sécurité', '510 / 780 U', '65%', 'bg-emerald-500'],
              ].map((row) => (
                <div key={row[0]} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-600">{row[0]}</span>
                    <span className="text-sm font-black text-slate-900">{row[1]}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row[3]} rounded-full`} style={{ width: row[2] }}></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-500">0</span>
                    <span className="text-rose-700">-210 U</span>
                    <span className="text-slate-900">{row[2]}</span>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-4">
                <span className="rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 text-[10px] font-black">
                  ! 3 objectifs en déficit
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-[10px] font-black">
                  ✓ 0 dépassement
                </span>
              </div>
            </article>

            <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">Ventes Journalières — 7 derniers jours</h2>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                  <button className="bg-blue-600 px-3 py-1 text-xs font-bold text-white">7J</button>
                  <button className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">14J</button>
                  <button className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">30J</button>
                </div>
              </div>
              <div className="mt-8 relative h-56">
                <div className="absolute left-0 right-0 h-40">
                  <div className="grid grid-cols-7 h-full items-end gap-3">
                    {lineData.map((row) => (
                      <div key={row.date} className="h-full flex flex-col justify-end items-center">
                        <div className="h-full flex items-end">
                          <div className="w-11 rounded-t-xl bg-blue-600" style={{ height: `${row.value}%` }}></div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-2">{row.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-300"></div>
              </div>
              <div className="flex items-center gap-5 mt-3 justify-center text-[10px] font-bold">
                <span className="inline-flex items-center gap-2 text-slate-700"><span className="w-3 h-3 border border-dashed border-slate-500"></span>Stock de Sécurité</span>
                <span className="inline-flex items-center gap-2 text-slate-700"><span className="w-3 h-3 bg-blue-600"></span>Ventes Journalières</span>
              </div>
            </article>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900">Suivi Journalier</h2>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-600 rounded-full px-3 py-1">11 enreg.</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-bold">
                  <Download className="w-3.5 h-3.5" /> XLS
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-3 py-2 text-xs font-bold">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['DATE', 'PRÉVISION (U)', 'RÉALISATION (U)', 'CUMUL ACHAT (U)', 'STOCK (U)', 'ÉCART JOUR', 'ÉCART CUMULÉ', 'STATUT'].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">
                        {canModifyDailyFollowUp ? (
                          <input
                            value={row[0]}
                            onChange={(event) => handleTableCellChange(idx, 0, event.target.value)}
                            className="w-24 border border-slate-200 rounded px-1 py-1 text-right bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        ) : (
                          row[0]
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">
                        {canModifyDailyFollowUp ? (
                          <input
                            value={row[1]}
                            onChange={(event) => handleTableCellChange(idx, 1, event.target.value)}
                            className="w-24 border border-slate-200 rounded px-1 py-1 text-right bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        ) : (
                          row[1]
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">
                        {canModifyDailyFollowUp ? (
                          <input
                            value={row[2]}
                            onChange={(event) => handleTableCellChange(idx, 2, event.target.value)}
                            className="w-24 border border-slate-200 rounded px-1 py-1 text-right bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        ) : (
                          row[2]
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">
                        {canModifyDailyFollowUp ? (
                          <input
                            value={row[3]}
                            onChange={(event) => handleTableCellChange(idx, 3, event.target.value)}
                            className="w-28 border border-slate-200 rounded px-1 py-1 text-right bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        ) : (
                          row[3]
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">
                        {canModifyDailyFollowUp ? (
                          <input
                            value={row[4]}
                            onChange={(event) => handleTableCellChange(idx, 4, event.target.value)}
                            className="w-24 border border-slate-200 rounded px-1 py-1 text-right bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        ) : (
                          row[4]
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-rose-700 text-right">
                        {canModifyDailyFollowUp ? (
                          <input
                            value={row[5]}
                            onChange={(event) => handleTableCellChange(idx, 5, event.target.value)}
                            className="w-24 border border-slate-200 rounded px-1 py-1 text-right bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          />
                        ) : (
                          row[5]
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-700 text-right">
                        {canModifyDailyFollowUp ? (
                          <input
                            value={row[6]}
                            onChange={(event) => handleTableCellChange(idx, 6, event.target.value)}
                            className="w-24 border border-slate-200 rounded px-1 py-1 text-right bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        ) : (
                          row[6]
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row[7] === 'Critique' ? (
                          <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-1 text-[10px] font-black border border-rose-200">
                            Critique
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-[10px] font-black border border-emerald-200">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};