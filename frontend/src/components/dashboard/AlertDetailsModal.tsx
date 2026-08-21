import React from 'react';
import { X } from 'lucide-react';
import type { DANode, DailyRecord, OperationalAssignment, Operationnel, AppRole } from '../../types';
import type { User } from '../../auth/AuthContext';

interface AlertDetailsModalProps {
  user: User | null;
  records: DailyRecord[];
  assignments: OperationalAssignment[];
  _operationnels: Operationnel[];
  _partners: DANode[];
  entityName: string;
  entityId?: string;
  isDark?: boolean;
  onClose: () => void;
}

const ROLE_BADGE: Record<AppRole, { label: string; className: string }> = {
  ADMIN: { label: 'Administrateur', className: 'bg-sky-100 text-sky-700' },
  MANAGER: { label: 'Manager', className: 'bg-slate-100 text-slate-700' },
  CHEF_OPE: { label: 'Chef opérationnel', className: 'bg-violet-100 text-violet-700' },
  OPERATIONNEL: { label: 'Opérationnel', className: 'bg-emerald-100 text-emerald-700' },
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};


export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  user,
  records = [],
  assignments = [],
  _operationnels = [],
  _partners = [],
  entityName,
  entityId,
  isDark = false,
  onClose,
}) => {
  const role: AppRole = user?.role ?? 'OPERATIONNEL';
  const roleBadge = ROLE_BADGE[role] ?? ROLE_BADGE.OPERATIONNEL;
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const dailySorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const isOperationnel = role === 'OPERATIONNEL';
  const isChef = role === 'CHEF_OPE';
  const isPilote = role === 'ADMIN' || role === 'MANAGER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
      >
        {/* En-tête */}
        <div className={`flex flex-wrap items-start justify-between gap-3 border-b px-6 py-5 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Détails de l&apos;alerte
              </h2>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {user?.nom_complet || user?.email || 'Utilisateur'} · {today}
            </p>
            <p className={`mt-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${
              isDark ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {entityName || '—'} est sous surveillance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les détails"
            className={`rounded-lg p-2 transition-colors ${
              isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {isOperationnel && (
            <section>
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Saisies journalières
              </h3>
              {dailySorted.length > 0 ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className={isDark ? 'bg-slate-800' : 'bg-slate-50'}>
                        <th className={`whitespace-nowrap border-b px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'}`}>Date</th>
                        <th className={`whitespace-nowrap border-b px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'}`}>Achat (U)</th>
                        <th className={`whitespace-nowrap border-b px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'}`}>Stock journalier (U)</th>
                        <th className={`whitespace-nowrap border-b px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'}`}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySorted.map((record) => (
                        <tr key={record.date} className={isDark ? 'odd:bg-slate-900 even:bg-slate-800/60' : 'odd:bg-white even:bg-slate-50/50'}>
                          <td className={`whitespace-nowrap border-b px-3 py-2 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(record.date)}</td>
                          <td className={`whitespace-nowrap border-b px-3 py-2 font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{record.achat.toLocaleString('fr-FR')}</td>
                          <td className={`whitespace-nowrap border-b px-3 py-2 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {record.stock_journalier !== null ? record.stock_journalier.toLocaleString('fr-FR') : <span className="text-slate-400">Non saisi</span>}
                          </td>
                          <td className="whitespace-nowrap border-b px-3 py-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${record.statut === 'CRITIQUE' ? (isDark ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700') : (isDark ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}`}>
                              {record.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aucune saisie effectuée pour ce périmètre aujourd'hui.</p>
              )}
            </section>
          )}

          {(isChef || isPilote) && (
            <section>
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Opérationnels affectés
              </h3>
              {(() => {
                const partnerAssignments = entityId
                  ? assignments.filter((a) => a.partenaireId === entityId)
                  : assignments;
                if (partnerAssignments.length === 0) {
                  return <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aucun opérationnel rattaché.</p>;
                }
                return (
                  <div className="mt-3 space-y-2">
                    {partnerAssignments.map((assignment) => (
                      <div key={assignment.userId} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                        <div>
                          <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{assignment.nomComplet}</p>
                          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{assignment.partenaireNom}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>Affecté</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>
          )}

          {(isChef || isPilote) && (
            <section>
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Historique des validations / corrections
              </h3>
              <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aucune donnée de validation disponible pour le moment.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};