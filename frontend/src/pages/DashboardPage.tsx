import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { mockHierarchyData, mockDashboardInitial } from '../data/mockHierarchy';
import type { POSNode, DashboardData } from '../types';
import { useAuth } from '../auth/AuthContext';
import { LogOut, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardInitial);

  const handleSelectPOS = (pos: POSNode) => {
    setDashboardData((prev) => ({
      ...prev,
      entite_id: pos.id,
      nom_entite: pos.nom,
    }));
  };

  const { kpi } = dashboardData;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Rétractable */}
      <Sidebar
        hierarchyData={mockHierarchyData}
        onSelectPOS={handleSelectPOS}
        selectedPosId={dashboardData.entite_id}
      />

      {/* Zone Principale */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {dashboardData.nom_entite}
            </h1>
            <p className="text-xs text-slate-500">
              Vue Opérationnelle & Suivi des Écarts
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              {user?.nom_complet} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Grille de KPI */}
        <main className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Objectif Mensuel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">
                Objectif Mensuel
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">
                {kpi.objectif_mensuel.toLocaleString()} FCFA
              </div>
            </div>

            {/* Réalisé Cumulé */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">
                Réalisé Cumulé
              </div>
              <div className="text-2xl font-black text-sky-600 mt-2">
                {kpi.realise_cumule.toLocaleString()} FCFA
              </div>
            </div>

            {/* Statut Alerte */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase">
                  Statut Réseau
                </div>
                <div
                  className={`text-lg font-bold mt-2 flex items-center gap-1.5 ${
                    kpi.statut_alerte === 'CRITIQUE'
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {kpi.statut_alerte === 'CRITIQUE' ? (
                    <>
                      <AlertTriangle className="w-5 h-5" /> Critique
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Normal
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};