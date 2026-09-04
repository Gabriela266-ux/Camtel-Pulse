import React, { useEffect, useRef } from 'react';
import { Clock3, Database, UserRound, X } from 'lucide-react';
import type { DailyRecord } from '../../types';

interface EntryDetailsModalProps {
  record: DailyRecord;
  entityName: string;
  isDark?: boolean;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  CHEF_OPE: 'Chef opérationnel',
  OPERATIONNEL: 'Opérationnel',
  INCONNU: 'Rôle inconnu',
};

export const EntryDetailsModal: React.FC<EntryDetailsModalProps> = ({ record, entityName, isDark = false, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const authors = record.saisie_auteurs ?? (record.saisi_par ? [record.saisi_par] : []);
  const lines = record.saisie_details?.lignes ?? [];

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="entry-detail-title" className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Traçabilité de la saisie</p>
            <h2 id="entry-detail-title" className="mt-1 text-xl font-black">Détail du {new Date(`${record.date}T00:00:00`).toLocaleDateString('fr-FR')}</h2>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entityName}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className={`cursor-pointer rounded-lg p-2 ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`} aria-label="Fermer le détail">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Achat saisi" value={`${record.achat.toLocaleString('fr-FR')} U`} isDark={isDark} />
          <Metric label="Stock journalier" value={record.stock_journalier === null ? 'Non saisi' : `${record.stock_journalier.toLocaleString('fr-FR')} U`} isDark={isDark} />
          <Metric label="Consommation" value={record.consommation === null ? 'En attente du lendemain' : `${record.consommation.toLocaleString('fr-FR')} U`} isDark={isDark} />
        </div>

        <div className={`mt-5 rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-sky-600" aria-hidden="true" /><h3 className="text-xs font-black uppercase tracking-wide">Auteur(s)</h3></div>
          {authors.length ? (
            <ul className="mt-3 space-y-2">
              {authors.map((author) => (
                <li key={author.id} className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <p className="text-sm font-bold">{author.nomComplet?.trim() || author.email || 'Utilisateur supprimé'}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{roleLabels[author.role] || author.role} / Chef : {author.chefOperationnel?.nomComplet || 'Non applicable'}{author.email ? ` · ${author.email}` : ''}</p>
                </li>
              ))}
            </ul>
          ) : <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Auteur indisponible pour cette ancienne donnée.</p>}
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2"><Database className="h-4 w-4 text-sky-600" aria-hidden="true" /><h3 className="text-xs font-black uppercase tracking-wide">Valeurs enregistrées</h3></div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            {lines.length ? lines.map((line) => {
              const author = authors.find((item) => item.id === line.auteurId);
              return (
                <div key={`${line.source}-${line.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-black">{line.source === 'STOCK' ? 'Stock journalier' : 'Achat du jour'}</p>
                    <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{author?.nomComplet || author?.email || 'Auteur indisponible'}{author ? ` · ${roleLabels[author.role] || author.role} / Chef : ${author.chefOperationnel?.nomComplet || 'Non applicable'}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-black text-sky-600">{line.valeur.toLocaleString('fr-FR')} U</p>
                    {line.saisiLe && <p className={`mt-1 inline-flex items-center gap-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Clock3 className="h-3 w-3" />{new Date(line.saisiLe).toLocaleString('fr-FR')}</p>}
                  </div>
                </div>
              );
            }) : <p className={`p-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Le détail ligne par ligne n’est pas disponible pour cette ancienne donnée.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; isDark: boolean }> = ({ label, value, isDark }) => (
  <article className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
    <p className={`text-[10px] font-black uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    <p className="mt-2 text-sm font-black">{value}</p>
  </article>
);
