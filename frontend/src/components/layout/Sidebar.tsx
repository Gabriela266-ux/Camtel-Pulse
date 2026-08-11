import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { HierarchyTree } from '../hierarchy/HierarchyTree';
import type { CentreHierarchy, POSNode } from '../../types';

interface SidebarProps {
  hierarchyData: CentreHierarchy;
  onSelectPOS: (pos: POSNode) => void;
  onSelectDSM?: (dsm: { id: number; nom: string }) => void;
  onSelectDA?: (da: { id: number; nom: string }) => void;
  selectedPosId?: number;
  canManageHierarchy?: boolean;
  onAddDSM?: (daId: number) => void;
  onAddPOS?: (dsmId: number) => void;
  onEditDSM?: (dsmId: number) => void;
  onEditPOS?: (posId: number) => void;
  onRemoveDSM?: (dsmId: number) => void;
  onRemovePOS?: (posId: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  hierarchyData,
  onSelectPOS,
  onSelectDSM,
  onSelectDA,
  selectedPosId,
  canManageHierarchy = false,
  onAddDSM,
  onAddPOS,
  onEditDSM,
  onEditPOS,
  onRemoveDSM,
  onRemovePOS,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [identitySearch, setIdentitySearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('chef-operationnelle');

  return (
    <aside
      className={`relative flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* En-tête avec bouton Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 h-16">
        {!isCollapsed && (
          <span className="font-bold text-slate-800 text-sm truncate">
            Réseau & Hiérarchie
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-auto"
          title={isCollapsed ? 'Dérouler le menu' : 'Réduire le menu'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-3 pt-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
              <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              Rechercher l'identité
            </div>
            <div className="mt-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Identité entreprise
              </label>
              <input
                value={identitySearch}
                onChange={(event) => setIdentitySearch(event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                placeholder="Entrer l'identité"
              />
            </div>
            <div className="mt-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Choisir un profil
              </label>
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="chef-operationnelle">Chef Opérationnelle</option>
                <option value="op-glotelho">Opérationnelle - Glotelho (Master SIM 1)</option>
                <option value="op-masters-colo">Opérationnelle - Masters Colo (Master SIM 2)</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">
                {selectedRole === 'chef-operationnelle' && 'Chef Opérationnelle'}
                {selectedRole === 'op-glotelho' && 'Opérationnelle Glotelho'}
                {selectedRole === 'op-masters-colo' && 'Opérationnelle Masters Colo'}
                {selectedRole === 'manager' && 'Manager'}
              </span>
              <button className="rounded-lg bg-sky-600 px-3 py-1 text-[10px] font-black text-white hover:bg-sky-700">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-3">
        {!isCollapsed ? (
          <HierarchyTree
            data={hierarchyData}
            onSelectPOS={onSelectPOS}
            onSelectDSM={onSelectDSM}
            onSelectDA={onSelectDA}
            selectedPosId={selectedPosId}
            canManageHierarchy={canManageHierarchy}
            onAddDSM={onAddDSM}
            onAddPOS={onAddPOS}
            onEditDSM={onEditDSM}
            onEditPOS={onEditPOS}
            onRemoveDSM={onRemoveDSM}
            onRemovePOS={onRemovePOS}
          />
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