import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Store, Network } from 'lucide-react';
import type { CentreHierarchy, POSNode } from '../../types';

interface HierarchyTreeProps {
  data: CentreHierarchy;
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

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  data,
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
  const [openDA, setOpenDA] = useState<Record<number, boolean>>({ 101: true, 102: true });
  const [openDSM, setOpenDSM] = useState<Record<number, boolean>>({ 201: true, 202: true, 203: true });

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
              onClick={() => {
                toggleDA(da.id);
                onSelectDA?.(da);
              }}
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          toggleDSM(dsm.id);
                          onSelectDSM?.(dsm);
                        }}
                        className="flex items-center gap-1.5 flex-1 p-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 rounded"
                      >
                        {openDSM[dsm.id] ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{dsm.nom}</span>
                      </button>

                      {canManageHierarchy && (
                        <span className="flex items-center gap-1">
                          <button
                            onClick={() => onAddPOS?.(dsm.id)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                            title="Ajouter POS"
                          >
                            + POS
                          </button>
                          <button
                            onClick={() => onEditDSM?.(dsm.id)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100"
                            title="Modifier DSM"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onRemoveDSM?.(dsm.id)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100"
                            title="Supprimer DSM"
                          >
                            Del
                          </button>
                        </span>
                      )}
                    </div>

                    {/* Niveau POS */}
                    {openDSM[dsm.id] && (
                      <div className="pl-5 space-y-0.5 mt-0.5">
                        {dsm.pos.map((pos) => {
                          const isSelected = pos.id === selectedPosId;
                          return (
                            <div key={pos.id} className="flex items-center gap-1">
                              <button
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

                              {canManageHierarchy && (
                                <span className="flex items-center gap-1">
                                  <button
                                    onClick={() => onEditPOS?.(pos.id)}
                                    className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    title="Modifier POS"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={() => onRemovePOS?.(pos.id)}
                                    className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    title="Supprimer POS"
                                  >
                                    ✕
                                  </button>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {canManageHierarchy && (
                  <div className="pl-2 pt-1">
                    <button
                      onClick={() => onAddDSM?.(da.id)}
                      className="text-[10px] font-bold px-2 py-1 rounded border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100"
                    >
                      + Ajouter DSM
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};