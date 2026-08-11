import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Store, Network } from 'lucide-react';
import type { CentreHierarchy, POSNode } from '../../types';

interface HierarchyTreeProps {
  data: CentreHierarchy;
  onSelectPOS: (pos: POSNode) => void;
  selectedPosId?: number;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  data,
  onSelectPOS,
  selectedPosId,
}) => {
  const [openDA, setOpenDA] = useState<Record<number, boolean>>({ 101: true });
  const [openDSM, setOpenDSM] = useState<Record<number, boolean>>({ 201: true });

  const toggleDA = (id: number) => setOpenDA((p) => ({ ...p, [id]: !p[id] }));
  const toggleDSM = (id: number) => setOpenDSM((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="text-sm select-none">
      {/* Niveau Centre */}
      <div className="flex items-center gap-2 p-2 font-bold text-slate-800 bg-slate-100 rounded-lg mb-2">
        <Building2 className="w-4 h-4 text-sky-600" />
        <span className="truncate">{data.nom}</span>
      </div>

      {/* Niveau Directeurs Associés / Master SIM */}
      <div className="pl-2 space-y-1">
        {data.da.map((da) => (
          <div key={da.id}>
            <button
              onClick={() => toggleDA(da.id)}
              className="flex items-center gap-1.5 w-full p-1.5 text-left font-semibold text-slate-700 hover:bg-slate-50 rounded"
            >
              {openDA[da.id] ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <Network className="w-4 h-4 text-slate-500" />
              <span className="truncate">{da.nom}</span>
            </button>

            {/* Niveau DSM */}
            {openDA[da.id] && (
              <div className="pl-4 space-y-1 mt-1">
                {da.dsm.map((dsm) => (
                  <div key={dsm.id}>
                    <button
                      onClick={() => toggleDSM(dsm.id)}
                      className="flex items-center gap-1.5 w-full p-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 rounded"
                    >
                      {openDSM[dsm.id] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{dsm.nom}</span>
                    </button>

                    {/* Niveau POS */}
                    {openDSM[dsm.id] && (
                      <div className="pl-5 space-y-0.5 mt-0.5">
                        {dsm.pos.map((pos) => {
                          const isSelected = pos.id === selectedPosId;
                          return (
                            <button
                              key={pos.id}
                              onClick={() => onSelectPOS(pos)}
                              className={`flex items-center gap-2 w-full p-1.5 text-xs rounded transition-colors text-left ${
                                isSelected
                                  ? 'bg-sky-50 text-sky-700 font-bold border-l-2 border-sky-600'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Store className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{pos.nom}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};