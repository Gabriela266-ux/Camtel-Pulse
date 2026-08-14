import React, { useState } from 'react';
import { ChevronLeft, Store, Search, X } from 'lucide-react';
import { HierarchyTree } from '../hierarchy/HierarchyTree';
import type { CentreHierarchy, EntitySelection } from '../../types';

interface SidebarProps {
  hierarchyData: CentreHierarchy;
  role: string;
  onSelectEntity: (entity: EntitySelection) => void;
  onAddDSM: (daId: number) => void;
  onAddPOS: (dsmId: number) => void;
  onMovePOS: (posId: number) => void;
  selectedEntityId?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  hierarchyData,
  role,
  onSelectEntity,
  onAddDSM,
  onAddPOS,
  onMovePOS,
  selectedEntityId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <aside
      className={`relative flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      <div className="border-b border-slate-100 p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="h-14 w-14 overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
            <img src="/logo-camtel.png"  alt="Logo Camtel" className="h-full w-full object-contain"/>
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold leading-none text-slate-800">
                Camtel-Pulse
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-400">CPDSM 1</div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="mb-4 flex gap-1">
              <div className="h-0.5 flex-1 rounded-full bg-sky-600" />
              <div className="h-0.5 flex-1 rounded-full border border-slate-200 bg-white" />
              <div className="h-0.5 flex-1 rounded-full bg-sky-600" />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Rôle actif</label>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                {role === 'ADMIN' && 'Administrateur'}
                {role === 'MANAGER' && 'Manager'}
                {role === 'CHEF_OPE' && 'Chef opérationnel'}
                {role === 'OPERATIONNEL' && 'Opérationnel'}
              </div>

              <div className="mt-2 rounded-lg border border-sky-100 bg-sky-100 px-2.5 py-2 text-xs leading-snug text-sky-600">
                {role === 'ADMIN' && 'Accès complet CPDSM 1'}
                {role === 'MANAGER' && 'Lecture seule sur tous les indicateurs'}
                {role === 'CHEF_OPE' && 'CPDSM 1 - Glotelho et Master Color'}
                {role === 'OPERATIONNEL' && 'Partenaire affecté - Glotelho'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-3">
        {!isCollapsed ? (
          <>
            {!isCollapsed && (
              <div className="border-b border-slate-100 px-3 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Client, DSM, POS..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-200"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label="Effacer la recherche"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <HierarchyTree
              data={hierarchyData}
              role={role}
              onSelectEntity={onSelectEntity}
              onAddDSM={onAddDSM}
              onAddPOS={onAddPOS}
              onMovePOS={onMovePOS}
              selectedEntityId={selectedEntityId}
              searchQuery={searchQuery}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 mt-2">
            <div title="Arbre Réseau">
              <Store className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
