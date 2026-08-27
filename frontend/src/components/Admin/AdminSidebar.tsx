import React from 'react';
import { Activity, Archive, FileUp, Network, ScrollText, Target, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  selected: 'users' | 'network' | 'objectives' | 'imports' | 'audit' | 'snapshots';
  onSelect: (s: Props['selected']) => void;
  userName?: string;
  /** Drawer mobile : ouvert ? (ignoré sur desktop) */
  isOpen?: boolean;
  /** Ferme le drawer mobile après une action. */
  onClose?: () => void;
  isDark?: boolean;
}

const items: Array<{ key: Props['selected']; label: string; icon: LucideIcon }> = [
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'network', label: 'Réseau', icon: Network },
  { key: 'objectives', label: 'Objectifs', icon: Target },
  { key: 'imports', label: 'Imports', icon: FileUp },
  { key: 'snapshots', label: 'Tableaux enregistrés', icon: Archive },
  { key: 'audit', label: 'Journal d’audit', icon: ScrollText },
];

const AdminSidebar: React.FC<Props> = ({ selected, onSelect, userName, isOpen = false, onClose, isDark = false }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r shadow-xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'} ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className={`flex items-start justify-between border-b p-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className={`mb-1 text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Administration</div>
            <div className={`max-w-[140px] truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{userName}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le menu"
          title="Fermer le menu"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-col gap-1.5 p-3" aria-label="Navigation administration">
        {items.map((item) => {
          const Icon = item.icon;
          return (
          <button
            key={item.key}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${selected === item.key ? 'bg-sky-600 text-white shadow-sm' : isDark ? 'text-slate-300 hover:bg-slate-900 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            onClick={() => {
              onSelect(item.key);
              onClose?.();
            }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </button>
        )})}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
