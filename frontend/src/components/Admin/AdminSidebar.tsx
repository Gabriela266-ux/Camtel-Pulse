import React from 'react';

interface Props {
	selected: 'users' | 'network' | 'objectives' | 'imports' | 'audit';
	onSelect: (s: Props['selected']) => void;
	userName?: string;
}

const AdminSidebar: React.FC<Props> = ({ selected, onSelect, userName }) => {
	return (
		<aside className="w-56 border-r border-slate-200 bg-white">
			<div className="p-4">
				<div className="mb-4 text-sm font-semibold text-slate-700">Admin</div>
				<div className="text-xs text-slate-500">{userName}</div>
			</div>

			<nav className="flex flex-col gap-1 p-2">
				<button
					className={`text-left rounded px-3 py-2 ${selected === 'users' ? 'bg-slate-100 font-bold' : ''}`}
					onClick={() => onSelect('users')}
				>
					Gestion utilisateurs
				</button>

				<button
					className={`text-left rounded px-3 py-2 ${selected === 'network' ? 'bg-slate-100 font-bold' : ''}`}
					onClick={() => onSelect('network')}
				>
					Gestion réseau
				</button>

				<button
					className={`text-left rounded px-3 py-2 ${selected === 'objectives' ? 'bg-slate-100 font-bold' : ''}`}
					onClick={() => onSelect('objectives')}
				>
					Objectifs mensuels
				</button>

				<button
					className={`text-left rounded px-3 py-2 ${selected === 'imports' ? 'bg-slate-100 font-bold' : ''}`}
					onClick={() => onSelect('imports')}
				>
					Imports
				</button>

				<button
					className={`text-left rounded px-3 py-2 ${selected === 'audit' ? 'bg-slate-100 font-bold' : ''}`}
					onClick={() => onSelect('audit')}
				>
					Audit
				</button>
			</nav>
		</aside>
	);
};

export default AdminSidebar;
