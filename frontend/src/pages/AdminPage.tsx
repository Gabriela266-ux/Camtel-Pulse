import React, { useState } from 'react';
import { Moon, SunMedium } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import AdminSidebar from '../components/Admin/AdminSidebar';
import { UserManagementPanel } from '../components/Admin/UserManagementPanel';
import { NetworkAdminPanel } from '../components/Admin/NetworkAdminPanel';
import { ObjectivesPanel } from '../components/Admin/ObjectivesPanel';
import { ImportsPanel } from '../components/Admin/ImportsPanel';
import { AuditLogsPanel } from '../components/Admin/AuditLogsPanel';

interface AdminPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ isDark, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const [selected, setSelected] = useState<'users' | 'network' | 'objectives' | 'imports' | 'audit'>('users');

  const backgroundClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const headerClass = isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-800';
  const badgeClass = isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600';

  return (
    <div className={`flex min-h-screen font-sans ${backgroundClass}`}>
      <AdminSidebar selected={selected} onSelect={(s) => setSelected(s)} userName={user?.nom_complet} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`flex h-16 items-center justify-between border-b px-6 ${headerClass}`}>
          <div>
            <h1 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Administration</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Espace réservé au Support informatique (ADMIN)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Basculer le thème"
            >
              {isDark ? <SunMedium className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {isDark ? 'Clair' : 'Sombre'}
            </button>
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${badgeClass}`}>
              {user?.nom_complet} ({user?.role})
            </span>
            <button
              onClick={logout}
              className={`ui-button-secondary px-3 py-2 ${
                isDark ? '' : ''
              }`}
              title="Déconnexion"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="space-y-6 overflow-y-auto p-6">
          {selected === 'users' && <UserManagementPanel />}
          {selected === 'network' && <NetworkAdminPanel />}
          {selected === 'objectives' && <ObjectivesPanel />}
          {selected === 'imports' && <ImportsPanel />}
          {selected === 'audit' && <AuditLogsPanel />}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
