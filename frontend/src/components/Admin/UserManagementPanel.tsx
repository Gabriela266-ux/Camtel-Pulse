import React, { useState } from 'react';
import type { AppRole } from '../../types';

interface AdminUser {
	id: number;
	nom_complet: string;
	email: string;
	role: AppRole;
	active: boolean;
	pending?: boolean;
}

const initial: AdminUser[] = [
	{ id: 1, nom_complet: 'Aicha Mbarga', email: 'aicha@example.com', role: 'ADMIN', active: true },
	{ id: 2, nom_complet: 'Jean Paul', email: 'jean@example.com', role: 'MANAGER', active: true },
	{ id: 3, nom_complet: 'Fatou N', email: 'fatou@example.com', role: 'OPERATIONNEL', active: false, pending: true },
];

export const UserManagementPanel: React.FC = () => {
	const [users, setUsers] = useState<AdminUser[]>(initial);

	const countActiveAdmins = () => users.filter((u) => u.role === 'ADMIN' && u.active).length;

	const toggleActive = (id: number) => {
		setUsers((prev) =>
			prev.map((u) => (u.id === id ? { ...u, active: !u.active, pending: false } : u)),
		);
	};

	const changeRole = (id: number, role: AppRole) => {
		setUsers((prev) => {
			const target = prev.find((p) => p.id === id);
			if (!target) return prev;

			if (role === 'ADMIN' && target.active) {
				const activeAdmins = prev.filter((u) => u.role === 'ADMIN' && u.active).length;
				if (activeAdmins >= 5) {
					alert('Limite atteinte : maximum 5 administrateurs actifs');
					return prev;
				}
			}

			return prev.map((u) => (u.id === id ? { ...u, role } : u));
		});
	};

	const approve = (id: number) => {
		setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, pending: false, active: true } : u)));
	};

	const reject = (id: number) => {
		setUsers((prev) => prev.filter((u) => u.id !== id));
	};

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-bold">Gestion des utilisateurs</h2>

			<table className="w-full table-auto border-collapse">
				<thead>
					<tr className="text-left text-sm text-slate-600">
						<th className="p-2">Nom</th>
						<th className="p-2">Email</th>
						<th className="p-2">Rôle</th>
						<th className="p-2">Actif</th>
						<th className="p-2">Actions</th>
					</tr>
				</thead>
				<tbody>
					{users.map((u) => (
						<tr key={u.id} className="border-t bg-white">
							<td className="p-2">{u.nom_complet}</td>
							<td className="p-2 text-sm text-slate-600">{u.email}</td>
							<td className="p-2">
								<select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as AppRole)}>
									<option value="ADMIN">ADMIN</option>
									<option value="MANAGER">MANAGER</option>
									<option value="CHEF_OPE">CHEF_OPE</option>
									<option value="OPERATIONNEL">OPERATIONNEL</option>
								</select>
							</td>
							<td className="p-2">
								<input type="checkbox" checked={u.active} onChange={() => toggleActive(u.id)} />
							</td>
							<td className="p-2">
								{u.pending ? (
									<>
										<button onClick={() => approve(u.id)} className="mr-2 text-emerald-600">
											Valider
										</button>
										<button onClick={() => reject(u.id)} className="text-rose-600">
											Refuser
										</button>
									</>
								) : (
									<span className="text-slate-500">—</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="text-sm text-slate-600">Administrateurs actifs: {countActiveAdmins()} / 5</div>
		</div>
	);
};

export default UserManagementPanel;
