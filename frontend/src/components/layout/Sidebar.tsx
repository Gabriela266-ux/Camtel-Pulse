import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { HierarchyTree } from '../hierarchy/HierarchyTree';
import type { CentreHierarchy, POSNode } from '../../types';

interface SidebarProps {
  hierarchyData: CentreHierarchy;
  onSelectPOS: (pos: POSNode) => void;
  selectedPosId?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  hierarchyData,
  onSelectPOS,
  selectedPosId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-3">
        {!isCollapsed ? (
          <HierarchyTree
            data={hierarchyData}
            onSelectPOS={onSelectPOS}
            selectedPosId={selectedPosId}
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