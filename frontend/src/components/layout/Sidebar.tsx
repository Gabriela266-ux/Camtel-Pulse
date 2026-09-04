import React, { useDeferredValue, useState } from 'react';
import { ChevronLeft, Store, Search, UserCog, X } from 'lucide-react';
import { HierarchyTree } from '../hierarchy/HierarchyTree';
import { PlatformLogo } from '../common/PlatformLogo';
import type { DAHierarchy, EntitySelection } from '../../types';
import type { User } from '../../auth/authState';

interface SidebarProps {
  hierarchyData: DAHierarchy;
  role: string;
  user?: User | null;
  onSelectEntity: (entity: EntitySelection) => void;
  onAddPartner: () => void;
  onManageOperationnels?: () => void;
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
  isDark?: boolean;
  /** Drawer mobile : ouvert ? (ignoré sur desktop) */
  isOpen?: boolean;
  /** Ferme le drawer mobile après une action. */
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  hierarchyData,
  role,
  user,
  onSelectEntity,
  onAddPartner,
  onManageOperationnels,
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
  isDark = false,
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Sélection d'entité : referme le drawer sur mobile.
  const handleSelectEntity = (entity: EntitySelection) => {
    onSelectEntity(entity);
    onClose?.();
  };

  const shellClass = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const headerBorderClass = isDark ? 'border-slate-700' : 'border-slate-100';
  const titleClass = isDark ? 'text-slate-100' : 'text-slate-800';
  const secondaryClass = isDark ? 'text-slate-400' : 'text-slate-400';
  const chipClass = isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700';
  const infoClass = isDark ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-sky-100 bg-sky-100 text-sky-600';
  const searchClass = isDark
    ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:ring-sky-500'
    : 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:ring-sky-200';
  const buttonClass = isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r shadow-xl transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 lg:shadow-none ${shellClass} ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'lg:w-16' : 'lg:w-72'} w-72`}
    >
      <div className={`border-b ${isCollapsed ? 'p-2' : 'p-4'} ${headerBorderClass}`}>
        <div className={`relative mb-4 flex flex-col items-center ${isCollapsed ? 'gap-2' : ''}`}>
          {isCollapsed ? (
            <img src="/logo-camtel.png" alt="Logo BLUE Financial Pulse" className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-contain shadow-sm" />
          ) : (
            <>
              <PlatformLogo size="modal" />
              <div className={`mt-2 text-center text-xs font-bold ${titleClass}`}>CPDSM 1</div>
            </>
          )}

          <div className={isCollapsed ? 'flex flex-col items-center gap-1' : 'absolute right-0 top-0 flex flex-col gap-1'}>
            <button
              onClick={onClose}
              title="Fermer le menu"
              aria-label="Fermer le menu"
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 lg:hidden ${buttonClass} ${isDark ? 'focus:ring-sky-500/40' : 'focus:ring-sky-200'}`}
            >
              <X className="h-4 w-4" />
            </button>

            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
              aria-label={isCollapsed ? 'Ouvrir la barre latérale' : 'Réduire la barre latérale'}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 ${buttonClass} ${isDark ? 'focus:ring-sky-500/40' : 'focus:ring-sky-200'}`}
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            <div className="mb-4 flex gap-1">
              <div className="h-0.5 flex-1 rounded-full bg-sky-600" />
              <div className={`h-0.5 flex-1 rounded-full border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`} />
              <div className="h-0.5 flex-1 rounded-full bg-sky-600" />
            </div>

            <div>
              <label className={`mb-1 block text-xs ${secondaryClass}`}>Rôle actif</label>

              <div className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${chipClass}`}>
                {role === 'ADMIN' && 'Administrateur'}
                {role === 'MANAGER' && 'Manager'}
                {role === 'CHEF_OPE' && 'Chef opérationnel'}
                {role === 'OPERATIONNEL' && 'Opérationnel'}
              </div>

              <div className={`mt-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${infoClass}`}>
                {role === 'ADMIN' && 'Lecture seule sur tous les indicateurs'}
                {role === 'MANAGER' && 'Lecture seule sur tous les indicateurs'}
                {role === 'CHEF_OPE' && `${hierarchyData.nom} - Gestion opérationnelle`}
                {role === 'OPERATIONNEL' && (() => {
                  const partnerIds = user?.partenaireIds?.length
                    ? user.partenaireIds
                    : user?.partenaireId ? [user.partenaireId] : [];
                  const names = hierarchyData.da.filter((da) => partnerIds.includes(da.id)).map((da) => da.nom);
                  return names.length
                    ? `Partenaires affectés - ${names.join(', ')}`
                    : 'Aucun partenaire affecté';
                })()}
              </div>

              {role === 'CHEF_OPE' && (
                <button
                  type="button"
                  onClick={() => { onManageOperationnels?.(); onClose?.(); }}
                  className={`mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors duration-200 focus:outline-none focus:ring-2 ${isDark ? 'border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 focus:ring-sky-500/40' : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 focus:ring-sky-200'}`}
                >
                  <UserCog className="h-4 w-4" />
                  Gérer les opérationnels
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-3">
        {!isCollapsed ? (
          <>
            {!isCollapsed && (
              <div className={`border-b px-3 py-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Nom, numéro, zone, DSM, POS…"
                    aria-label="Rechercher une entité par nom, numéro, code ou zone"
                    className={`w-full rounded-lg border py-2 pl-9 pr-8 text-xs outline-none ${searchClass}`}
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
              role={role === 'ADMIN' ? 'MANAGER' : role}
              onSelectEntity={handleSelectEntity}
              onAddPartner={onAddPartner}
              onEditPartner={onEditPartner}
              onDeletePartner={onDeletePartner}
              onAddDSM={onAddDSM}
              onEditDSM={onEditDSM}
              onDeleteDSM={onDeleteDSM}
              onAddPOS={onAddPOS}
              onEditPOS={onEditPOS}
              onDeletePOS={onDeletePOS}
              onMovePOS={onMovePOS}
              selectedEntityId={selectedEntityId}
              searchQuery={deferredSearchQuery}
              isDark={isDark}
            />
          </>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-4">
            <div title="Arbre Réseau">
              <Store className="h-6 w-6 text-sky-600" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};


