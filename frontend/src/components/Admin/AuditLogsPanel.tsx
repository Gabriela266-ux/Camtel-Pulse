import React from 'react';

import { useEffect, useState } from 'react';
import { apiService } from '../../api/services';

interface AuditLog {
  id: string;
  date: string;
  auteur: string;
  roleAuteur: string;
  type: string;
  partenaire?: string | null;
  entite: string;
  detail: string | null;
  statut: string;
}

export const AuditLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiService
      .getAudit()
      .then((data) => {
        if (!cancelled) setLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold">Audit</h2>
      <p className="text-sm text-slate-600">Voir qui a fait quoi, filtrer par utilisateur/date/action.</p>
      {loading ? (
        <div className="mt-4 rounded border bg-white p-4">Chargement du journal...</div>
      ) : logs.length === 0 ? (
        <div className="mt-4 rounded border bg-white p-4">Aucune action enregistrée.</div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded border bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Date', 'Auteur', 'Rôle', 'Action', 'Partenaire', 'Entité', 'Détails', 'Statut'].map((column) => (
                  <th key={column} className="whitespace-nowrap border-b px-4 py-2.5 text-left text-xs font-black uppercase tracking-wide text-slate-400">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-600">
                    {new Date(log.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-bold text-slate-800">{log.auteur}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{log.roleAuteur}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{log.type}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{log.partenaire || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{log.entite || '—'}</td>
                  <td className="max-w-xs px-4 py-2.5 text-xs text-slate-600">{log.detail || '—'}</td>
                  <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{log.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPanel;
