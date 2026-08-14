import React from 'react';

export const AuditLogsPanel: React.FC = () => {
	return (
		<div>
			<h2 className="text-lg font-bold">Audit</h2>
			<p className="text-sm text-slate-600">Voir qui a fait quoi, filtrer par utilisateur/date/action.</p>
			<div className="mt-4 rounded border bg-white p-4">(Journal des actions — à implémenter)</div>
		</div>
	);
};

export default AuditLogsPanel;
