import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Store, Network, Plus, MoveRight } from 'lucide-react';
import type { CentreHierarchy, EntitySelection } from '../../types';

interface HierarchyTreeProps {
  data: CentreHierarchy;
  role: string;
  onSelectEntity: (entity: EntitySelection) => void;
  onAddDSM: (daId: number) => void;
  onAddPOS: (dsmId: number) => void;
  onMovePOS: (posId: number) => void;
  selectedEntityId?: number;
  searchQuery: string;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  data,
  role,
  onSelectEntity,
  onAddDSM,
  onAddPOS,
  onMovePOS,
  selectedEntityId,
  searchQuery,
}) => {
  const [openDA, setOpenDA] = useState<Record<number, boolean>>({ 101: true });
  const [openDSM, setOpenDSM] = useState<Record<number, boolean>>({});
  const canManageNetwork = role === 'CHEF_OPE' || role === 'OPERATIONNEL';
  const canMovePOS = role === 'CHEF_OPE';

  const toggleDA = (id: number) => setOpenDA((p) => ({ ...p, [id]: !p[id] }));
  const toggleDSM = (id: number) => setOpenDSM((p) => ({ ...p, [id]: !p[id] }));

  const query = searchQuery.trim().toLocaleLowerCase('fr-FR');

  const filteredDA = data.da
    .map((da) => ({
      ...da,
      dsm: da.dsm
        .map((dsm) => ({
          ...dsm,
          pos: dsm.pos.filter((pos) =>
            pos.nom.toLocaleLowerCase('fr-FR').includes(query),
          ),
        }))
        .filter(
          (dsm) =>
            dsm.nom.toLocaleLowerCase('fr-FR').includes(query) || dsm.pos.length > 0,
        ),
    }))
    .filter(
      (da) =>
        !query ||
        da.nom.toLocaleLowerCase('fr-FR').includes(query) ||
        da.dsm.length > 0,
    );

  return (
    <div className="text-sm select-none">
      {/* Niveau Centre */}
      <div className="flex items-center gap-2 p-2 font-bold text-slate-800 bg-slate-100 rounded-lg mb-2">
        <Building2 className="w-4 h-4 text-sky-600" />
        <span className="truncate">{data.nom}</span>
      </div>

      {/* Niveau Directeurs Associés / Master SIM */}
      <div className="pl-2 space-y-1">
        {filteredDA.map((da) => (
          <div key={da.id}>
            <button
              onClick={() => {
                toggleDA(da.id);
                onSelectEntity({ type: 'DA', id: da.id, nom: da.nom });
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
                {canManageNetwork && (
                  <button
                    type="button"
                    onClick={() => onAddDSM(da.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter DSM
                  </button>
                )}

                {da.dsm.length === 0 && (
                  <div className="rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-400">
                    Aucun DSM ajouté.
                  </div>
                )}

                {da.dsm.map((dsm) => (
                  <div key={dsm.id} className="space-y-1">
                    <button
                      onClick={() => {
                        toggleDSM(dsm.id);
                        onSelectEntity({ type: 'DSM', id: dsm.id, nom: dsm.nom });
                      }}
                      className="flex items-center gap-1.5 w-full p-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 rounded"
                    >
                      {openDSM[dsm.id] ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{dsm.nom}</span>
                    </button>

                    {openDSM[dsm.id] && canManageNetwork && (
                      <button
                        type="button"
                        onClick={() => onAddPOS(dsm.id)}
                        className="ml-5 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter POS
                      </button>
                    )}

                    {/* Niveau POS */}
                    {openDSM[dsm.id] && (
                      <div className="pl-5 space-y-0.5 mt-0.5">
                        {dsm.pos.length === 0 && (
                          <div className="rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-400">
                            Aucun POS ajouté.
                          </div>
                        )}

                        {dsm.pos.map((pos) => {
                          const isSelected = pos.id === selectedEntityId;
                          return (
                            <div key={pos.id} className="flex items-center gap-1">
                              <button
                                onClick={() => onSelectEntity({ type: 'POS', id: pos.id, nom: pos.nom })}
                                className={`flex min-w-0 flex-1 items-center gap-2 rounded p-1.5 text-left text-xs transition-colors ${
                                  isSelected
                                    ? 'border-l-2 border-sky-600 bg-sky-50 font-bold text-sky-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <Store className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{pos.nom}</span>
                              </button>
                              {canMovePOS && (
                                <button
                                  type="button"
                                  onClick={() => onMovePOS(pos.id)}
                                  className="rounded p-1 text-amber-600 hover:bg-amber-50"
                                  title="Modifier l'emplacement du POS"
                                >
                                  <MoveRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
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
