import React, { useState } from 'react';
import { Menu, Moon, SunMedium } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import AdminSidebar from '../components/Admin/AdminSidebar';
import { UserManagementPanel } from '../components/Admin/UserManagementPanel';
import { ImportsPanel } from '../components/Admin/ImportsPanel';
import { AuditLogsPanel } from '../components/Admin/AuditLogsPanel';
import { SnapshotsPanel } from '../components/dashboard/SnapshotsPanel';
import { AccessRequestsPanel } from '../components/dashboard/AccessRequestsPanel';

interface AdminPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ isDark, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const [selected, setSelected] = useState<'users' | 'imports' | 'audit' | 'snapshots'>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const backgroundClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const headerClass = isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-800';
  const badgeClass = isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600';

  return (
    <div className={`flex min-h-screen font-sans ${backgroundClass}`}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <AdminSidebar
        selected={selected}
        onSelect={(s) => setSelected(s)}
        userName={user?.nom_complet}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDark={isDark}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-3 sm:px-6 ${headerClass}`}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition lg:hidden ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
              aria-label="Ouvrir le menu"
              title="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className={`truncate text-base font-black sm:text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Administration</h1>
              <p className={`hidden truncate text-xs sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Espace réservé au Support informatique (ADMIN)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
              <span className="hidden sm:inline">{isDark ? 'Clair' : 'Sombre'}</span>
            </button>
            <span className={`hidden max-w-[180px] truncate rounded-full px-3 py-1.5 text-xs font-bold md:inline ${badgeClass}`}>
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

        <main className="space-y-4 overflow-x-hidden overflow-y-auto p-4 sm:space-y-6 sm:p-6">
          {selected === 'users' && <>
            <AccessRequestsPanel />
            <UserManagementPanel />
          </>}
          {selected === 'imports' && <ImportsPanel />}
          {selected === 'snapshots' && <SnapshotsPanel isDark={isDark} allowDelete />}
          {selected === 'audit' && <AuditLogsPanel />}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
