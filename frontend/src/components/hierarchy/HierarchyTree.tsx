import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Store, Network, Plus, MoveRight, Pencil, Trash2 } from 'lucide-react';
import type { DAHierarchy, EntitySelection } from '../../types';
import { filterHierarchy, normalizeHierarchySearch } from '../../utils/hierarchySearch';

interface HierarchyTreeProps {
  data: DAHierarchy;
  role: string;
  onSelectEntity: (entity: EntitySelection) => void;
  onAddPartner: () => void;
  onEditPartner: (partnerId: string) => void;
  onDeletePartner: (partnerId: string) => void;
  onAddDSM: (daId: string) => void;
  onEditDSM: (dsmId: string) => void;
  onDeleteDSM: (dsmId: string) => void;
  onAddPOS: (dsmId: string) => void;
  onEditPOS: (posId: string) => void;
  onDeletePOS: (posId: string) => void;
  onMovePOS: (posId: string) => void;
  selectedEntityId?: string;
  searchQuery?: string;
  isDark?: boolean;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  data,
  role,
  onSelectEntity,
  onAddPartner,
  onEditPartner,
  onDeletePartner,
  onAddDSM,
  onEditDSM,
  onDeleteDSM,
  onAddPOS,
  onEditPOS,
  onDeletePOS,
  onMovePOS,
  selectedEntityId,
  searchQuery = '',
  isDark = false,
}) => {
  const [openDA, setOpenDA] = useState<Record<string, boolean>>({});
  const [openDSM, setOpenDSM] = useState<Record<string, boolean>>({});
  const canManageNetwork = role === 'CHEF_OPE' || role === 'OPERATIONNEL';
  const canMovePOS = role === 'CHEF_OPE';

  const toggleDA = (id: string) => setOpenDA((p) => ({ ...p, [id]: !p[id] }));
  const toggleDSM = (id: string) => setOpenDSM((p) => ({ ...p, [id]: !p[id] }));

  const hasQuery = Boolean(normalizeHierarchySearch(searchQuery));
  const filteredDA = filterHierarchy(data, searchQuery);

  const shellClass = isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800';
  const subCardClass = isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-400';

  return (
    <div className="select-none text-sm">
      <div className={`mb-2 flex items-center gap-2 rounded-lg p-2 font-bold ${shellClass}`}>
        <Building2 className="h-4 w-4 text-sky-600" />
        <span className="truncate">{data.nom}</span>
      </div>

      {/* Niveau Directeurs Associés / Master SIM */}
      <div className="space-y-1 pl-2">
        {role === 'CHEF_OPE' && !hasQuery && (
          <button
            type="button"
            onClick={onAddPartner}
            className={`mb-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold ${
              isDark ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-700'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter partenaire
          </button>
        )}
        {filteredDA.map((da) => (
          <div key={da.id}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  toggleDA(da.id);
                  onSelectEntity({ type: 'DA', id: da.id, nom: da.nom_reseau || da.nom });
                }}
                className={`flex flex-1 items-center gap-1.5 rounded p-1.5 text-left font-semibold ${
                  isDark ? 'text-slate-100 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {hasQuery || openDA[da.id] ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <Network className="w-4 h-4 text-slate-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{da.nom}</span>
                  {da.nom_reseau && (
                    <span className={`mt-0.5 block truncate font-mono text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                      {da.nom_reseau}
                    </span>
                  )}
                </span>
              </button>

              {role === 'CHEF_OPE' && (
                <>
                  <button
                    type="button"
                    onClick={() => onEditPartner(da.id)}
                    className="rounded p-1 text-sky-600 hover:bg-sky-50"
                    title="Modifier le partenaire"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePartner(da.id)}
                    className="rounded p-1 text-rose-600 hover:bg-rose-50"
                    title="Supprimer le partenaire"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Niveau DSM */}
            {(hasQuery || openDA[da.id]) && (
              <div className="pl-4 space-y-1 mt-1">
                {canManageNetwork && (
                  <button
                    type="button"
                    onClick={() => onAddDSM(da.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold ${
                      isDark
                        ? 'border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                        : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter DSM
                  </button>
                )}

                {da.dsm.length === 0 && (
                  <div className={`rounded-md px-2.5 py-2 text-xs ${subCardClass}`}>
                    Aucun DSM ajouté.
                  </div>
                )}

                {da.dsm.map((dsm) => (
                  <div key={dsm.id} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          toggleDSM(dsm.id);
                          onSelectEntity({ type: 'DSM', id: dsm.id, nom: dsm.nom_reseau || dsm.nom });
                        }}
                        className={`flex min-w-0 flex-1 items-center gap-1.5 rounded p-1.5 text-left text-xs font-medium ${
                          isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {hasQuery || openDSM[dsm.id] ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{dsm.nom}</span>
                          {dsm.nom_reseau && (
                            <span className={`mt-0.5 block truncate font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                              {dsm.nom_reseau}
                            </span>
                          )}
                        </span>
                        {dsm.code_zone && (
                          <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                            {dsm.code_zone}
                          </span>
                        )}
                      </button>

                      {role === 'CHEF_OPE' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditDSM(dsm.id)}
                            className="rounded p-1 text-sky-600 hover:bg-sky-50"
                            title="Modifier le DSM"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDSM(dsm.id)}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                            title="Supprimer le DSM"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {(hasQuery || openDSM[dsm.id]) && canManageNetwork && !hasQuery && (
                      <button
                        type="button"
                        onClick={() => onAddPOS(dsm.id)}
                        className={`ml-5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold ${
                          isDark
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter POS
                      </button>
                    )}

                    {/* Niveau POS */}
                    {(hasQuery || openDSM[dsm.id]) && (
                      <div className="pl-5 space-y-0.5 mt-0.5">
                        {dsm.pos.length === 0 && (
                          <div className={`rounded-md px-2.5 py-2 text-xs ${subCardClass}`}>
                            Aucun POS ajouté.
                          </div>
                        )}

                        {dsm.pos.map((pos) => {
                          const isSelected = pos.id === selectedEntityId;
                          return (
                            <div key={pos.id} className="flex items-center gap-1">
                              <button
                                onClick={() => onSelectEntity({ type: 'POS', id: pos.id, nom: pos.nom_reseau || pos.nom })}
                                className={`flex min-w-0 flex-1 items-center gap-2 rounded p-1.5 text-left text-xs transition-colors ${
                                  isSelected
                                    ? isDark
                                      ? 'border-l-2 border-sky-600 bg-sky-500/10 font-bold text-sky-300'
                                      : 'border-l-2 border-sky-600 bg-sky-50 font-bold text-sky-700'
                                    : isDark
                                      ? 'text-slate-200 hover:bg-slate-800'
                                      : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <Store className="h-3.5 w-3.5 shrink-0" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-mono">{pos.nom_reseau || pos.nom}</span>
                                  {pos.nom_reseau && pos.nom !== pos.nom_reseau && (
                                    <span className={`mt-0.5 block truncate text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                                      {pos.nom}
                                    </span>
                                  )}
                                </span>
                              </button>

                              {role === 'CHEF_OPE' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onEditPOS(pos.id)}
                                    className="rounded p-1 text-sky-600 hover:bg-sky-50"
                                    title="Modifier le POS"
                                  >
                                  <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeletePOS(pos.id)}
                                    className="rounded p-1 text-rose-600 hover:bg-rose-50"
                                    title="Supprimer le POS"
                                  >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

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
        {filteredDA.length === 0 && hasQuery && (
          <div className={`rounded-lg border px-3 py-4 text-center text-xs ${isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            Aucune entité ne correspond à ce nom, numéro, code ou cette zone.
          </div>
        )}
      </div>
    </div>
  );
};
