import React, { useDeferredValue, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { apiService } from '../../api/services';

interface AuditLog {
  id: string;
  date: string;
  auteur: string;
  roleAuteur: string;
  chefOperationnel?: { id: string; nomComplet: string; matricule: string } | null;
  type: string;
  partenaire?: string | null;
  entite: string;
  detail: string | null;
  statut: string;
  centreId?: string | null;
  centre?: { code_centre?: string; nom_centre?: string } | null;
  details?: Record<string, unknown>;
}

export const AuditLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('TOUTES');
  const [centreFilter, setCentreFilter] = useState('TOUS');
  const [fromDate, setFromDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

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

  const actions = [...new Set(logs.map((log) => log.type))].sort();
  const centres = Array.from(new Map(logs.filter((log) => log.centreId && log.centre).map((log) => [log.centreId!, log.centre!])).entries());
  const visibleLogs = logs.filter((log) => {
    const matchesQuery = !deferredQuery || [log.auteur, log.roleAuteur, log.chefOperationnel?.nomComplet, log.type, log.entite, log.detail, log.partenaire, log.centre?.code_centre, log.centre?.nom_centre]
      .some((value) => String(value || '').toLowerCase().includes(deferredQuery));
    const matchesAction = actionFilter === 'TOUTES' || log.type === actionFilter;
    const matchesCentre = centreFilter === 'TOUS' || log.centreId === centreFilter;
    const matchesDate = !fromDate || String(log.date).slice(0, 10) >= fromDate;
    return matchesQuery && matchesAction && matchesCentre && matchesDate;
  });

  return (
    <div>
      <h2 className="text-lg font-bold">Audit</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">Voir qui a fait quoi, filtrer par utilisateur/date/action.</p>
      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <label className="relative md:col-span-1"><span className="sr-only">Rechercher dans l’audit</span><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Auteur, action, entité…" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-2 text-xs outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="text-[11px] font-bold text-slate-500"><span className="sr-only">Filtrer par action</span><select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="TOUTES">Toutes les actions</option>{actions.map((action) => <option key={action}>{action}</option>)}</select></label>
        <label className="text-[11px] font-bold text-slate-500"><span className="sr-only">Filtrer par centre</span><select value={centreFilter} onChange={(event) => setCentreFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="TOUS">Tous les centres</option>{centres.map(([id, centre]) => <option key={id} value={id}>{centre.code_centre} — {centre.nom_centre}</option>)}</select></label>
        <label className="text-[11px] font-bold text-slate-500"><span className="sr-only">Filtrer depuis une date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" /></label>
      </div>
      {loading ? (
        <div className="mt-4 rounded border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">Chargement du journal...</div>
      ) : logs.length === 0 ? (
        <div className="mt-4 rounded border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">Aucune action enregistrée.</div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded border bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950">
                {['Date', 'Auteur', 'Rôle / Chef', 'Centre', 'Action', 'Entité', 'Détails', 'Statut'].map((column) => (
                  <th key={column} className="whitespace-nowrap border-b px-4 py-2.5 text-left text-xs font-black uppercase tracking-wide text-slate-400">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => (<React.Fragment key={log.id}>
                <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-600">
                    {new Date(log.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-bold text-slate-800">{log.auteur}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300"><p className="font-bold">{log.roleAuteur}</p><p className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">Chef / {log.chefOperationnel?.nomComplet || 'Non applicable'}</p></td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300"><p className="font-bold">{log.centre?.code_centre || 'Global'}</p><p className="whitespace-nowrap text-[10px] text-slate-400">{log.centre?.nom_centre}</p></td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{log.type}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{log.entite || '—'}</td>
                  <td className="max-w-xs px-4 py-2.5 text-xs text-slate-600"><button type="button" onClick={() => setExpanded((current) => current === log.id ? null : log.id)} className="inline-flex cursor-pointer items-center gap-1 font-bold text-sky-600 hover:text-sky-700">{expanded === log.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}Voir</button></td>
                  <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{log.statut}</td>
                </tr>
                {expanded === log.id && <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"><td colSpan={8} className="px-4 py-4"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{log.detail || 'Modification enregistrée'}</p><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{JSON.stringify(log.details || {}, null, 2)}</pre></td></tr>}
              </React.Fragment>))}
            </tbody>
          </table>
          {visibleLogs.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Aucune action ne correspond aux filtres.</p>}
        </div>
      )}
    </div>
  );
};

export default AuditLogsPanel;
