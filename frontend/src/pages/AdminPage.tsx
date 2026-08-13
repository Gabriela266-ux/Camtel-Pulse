import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import AdminSidebar from '../components/Admin/AdminSidebar';
import { UserManagementPanel } from '../components/Admin/UserManagementPanel';
import { NetworkAdminPanel } from '../components/Admin/NetworkAdminPanel';
import { ObjectivesPanel } from '../components/Admin/ObjectivesPanel';
import { ImportsPanel } from '../components/Admin/ImportsPanel';
import { AuditLogsPanel } from '../components/Admin/AuditLogsPanel';

export const AdminPage: React.FC = () => {
	const { user, logout } = useAuth();
	const [selected, setSelected] = useState<'users' | 'network' | 'objectives' | 'imports' | 'audit'>('users');

	return (
		<div className="flex min-h-screen bg-slate-50 font-sans">
			<AdminSidebar selected={selected} onSelect={(s) => setSelected(s)} userName={user?.nom_complet} />

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
					<div>
						<h1 className="text-lg font-black text-slate-800">Administration</h1>
						<p className="text-xs text-slate-500">Espace réservé au Support informatique (ADMIN)</p>
					</div>

					<div className="flex items-center gap-3">
						<span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
							{user?.nom_complet} ({user?.role})
						</span>
						<button
							onClick={logout}
							className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
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
