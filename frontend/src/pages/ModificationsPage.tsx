import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Eye, Filter, Moon, SunMedium, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { apiService } from '../api/services';

interface ModificationsPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

type ModificationType =
  | 'DSM_AJOUTE'
  | 'POS_AJOUTE'
  | 'POS_DEPLACE'
  | 'SAISIE_CREEE'
  | 'SAISIE_CORRIGEE'
  | 'CORRECTION_VALIDEE'
  | 'OPERATIONNEL_AFFECTE'
  | 'OPERATIONNEL_DESAFFECTE'
  | 'OPERATIONNEL_SUSPENDU'
  | 'OPERATIONNEL_REACTIVE'
  | 'OPERATIONNEL_TRANSFERE_CHEF';

// Données chargées depuis GET /api/dashboard/audit (plus de mock).
// Le backend renvoie des objets déjà mappés vers ce contrat ({ auteur, roleAuteur, type, ... }).
interface RawModification {
  id: string;
  date: string;
  auteurId?: string | null;
  auteur: string;
  auteurEmail?: string | null;
  roleAuteur: string;
  chefOperationnel?: { id: string; nomComplet: string; matricule: string } | null;
  type: string;
  partenaireId?: string | null;
  partenaire?: string | null;
  entite?: string | null;
  detail?: string | null;
  details?: Record<string, unknown>;
  statut: string;
}

const labels: Record<string, string> = {
  DSM_AJOUTE: 'Ajout DSM',
  POS_AJOUTE: 'Ajout POS',
  POS_DEPLACE: 'Déplacement POS',
  SAISIE_CREEE: 'Saisie journalière',
  SAISIE_CORRIGEE: 'Correction de saisie',
  CORRECTION_VALIDEE: 'Validation de correction',
  OPERATIONNEL_AFFECTE: 'Affectation opérationnel',
  OPERATIONNEL_DESAFFECTE: 'Retrait d’affectation',
  OPERATIONNEL_SUSPENDU: 'Suspension opérationnel',
  OPERATIONNEL_REACTIVE: 'Réactivation opérationnel',
  OPERATIONNEL_TRANSFERE_CHEF: 'Transfert vers un Chef',
};

const statusClasses: Record<string, string> = {
  EFFECTUEE: 'bg-sky-50 text-sky-700 border-sky-200',
  EN_ATTENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDEE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUSEE: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const ModificationsPage: React.FC<ModificationsPageProps> = ({ isDark, onToggleTheme }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [period, setPeriod] = useState('MONTH');
  const [type, setType] = useState<'ALL' | ModificationType>('ALL');
  const [modifications, setModifications] = useState<RawModification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModification, setSelectedModification] = useState<RawModification | null>(null);

  // Chargement réel depuis GET /api/dashboard/audit (plus de mock).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiService
      .getAudit()
      .then((data) => {
        if (!cancelled) setModifications(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Impossible de charger l'historique :", err);
        if (!cancelled) setModifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleModifications = useMemo(() => {
    const role = user?.role;

    return modifications.filter((modification) => {
      if (role === 'OPERATIONNEL') {
        return String(modification.auteurId) === String(user?.id);
      }
      return true;
    });
  }, [user, modifications]);

  const filteredModifications = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    return visibleModifications.filter((modification) => {
      const modificationDate = new Date(modification.date);
      const modificationKey = modificationDate.toISOString().slice(0, 10);
      const isToday = modificationKey === todayKey;

      const isInLast7Days =
        now.getTime() - modificationDate.getTime() <= 7 * 24 * 60 * 60 * 1000;

      const isCurrentMonth =
        modificationDate.getMonth() === now.getMonth() &&
        modificationDate.getFullYear() === now.getFullYear();

      const matchesPeriod =
        period === 'TODAY'
          ? isToday
          : period === 'WEEK'
          ? isInLast7Days
          : period === 'MONTH'
          ? isCurrentMonth
          : true;

      const matchesType = type === 'ALL' || modification.type === type;

      return matchesPeriod && matchesType;
    });
  }, [period, type, visibleModifications]);

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="ui-button-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </button>

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
        </div>

        <section className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Historique et traçabilité</p>
              <h1 className={`mt-1 text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Détails des modifications</h1>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Consultez les ajouts DSM/POS, saisies, corrections et affectations.
              </p>
            </div>

            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
              {filteredModifications.length} modification(s)
            </span>
          </div>

          <div className={`mt-6 flex flex-wrap gap-3 border-t pt-4 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <label className={`inline-flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <CalendarDays className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
              Période
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-sky-200 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <option value="TODAY">Aujourd’hui</option>
                <option value="WEEK">7 derniers jours</option>
                <option value="MONTH">Mois en cours</option>
                <option value="ALL">Toute la période</option>
              </select>
            </label>

            <label className={`inline-flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <Filter className="h-4 w-4 text-slate-400" />
              Action
              <select
                value={type}
                onChange={(event) => setType(event.target.value as 'ALL' | ModificationType)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-sky-200 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <option value="ALL">Toutes les actions</option>
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className={`mt-5 overflow-hidden rounded-2xl border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={isDark ? 'bg-slate-800' : 'bg-slate-50'}>
                  {['Date', 'Auteur', 'Action', 'Partenaire', 'Entité', 'Détails', 'Statut'].map((column) => (
                    <th
                      key={column}
                      className={`whitespace-nowrap border-b px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide ${
                        isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredModifications.map((modification) => (
                  <tr key={modification.id} className={`border-b last:border-0 ${isDark ? 'border-slate-700 hover:bg-slate-800/70' : 'border-slate-100 hover:bg-sky-50/50'}`}>
                    <td className={`whitespace-nowrap px-4 py-3 font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {new Date(modification.date).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{modification.auteur}</p>
                      <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{modification.roleAuteur} / Chef : {modification.chefOperationnel?.nomComplet || 'Non applicable'}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                        {labels[modification.type] ?? modification.type}
                      </span>
                    </td>

                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{modification.partenaire || '—'}</td>
                    <td className={`px-4 py-3 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{modification.entite || '—'}</td>

                    <td className="max-w-sm px-4 py-3">
                      <button type="button" onClick={() => setSelectedModification(modification)} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Voir le détail
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClasses[modification.statut] ?? ''}`}>
                        {modification.statut}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredModifications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      {loading ? 'Chargement de l\u2019historique…' : 'Aucune modification ne correspond aux filtres choisis.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        {selectedModification && (
          <ModificationDetailsModal modification={selectedModification} isDark={isDark} onClose={() => setSelectedModification(null)} />
        )}
      </div>
    </div>
  );
};

const detailFieldLabels: Record<string, string> = {
  date: 'Date concernée',
  entity_type: 'Type d’entité',
  entity_id: 'Identifiant de l’entité',
  valeurs: 'Valeurs enregistrées',
  avant: 'Affectations avant',
  apres: 'Affectations après',
  ajoutes: 'Partenaires ajoutés',
  retires: 'Partenaires retirés',
  partenaires: 'Partenaires concernés',
  operationnel: 'Opérationnel concerné',
  statut: 'Statut',
};

function displayDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Non renseigné';
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => displayDetailValue(item)).join(' · ') : 'Aucun';
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${detailFieldLabels[key] || key}: ${displayDetailValue(item)}`)
      .join(' | ');
  }
  return String(value);
}

const ModificationDetailsModal: React.FC<{ modification: RawModification; isDark: boolean; onClose: () => void }> = ({ modification, isDark, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-labelledby="modification-detail-title" className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Historique d’activité</p>
          <h2 id="modification-detail-title" className="mt-1 text-xl font-black">{labels[modification.type] || modification.type}</h2>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(modification.date).toLocaleString('fr-FR')}</p>
        </div>
        <button type="button" onClick={onClose} autoFocus className={`cursor-pointer rounded-lg p-2 ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Fermer le détail"><X className="h-4 w-4" /></button>
      </div>
      <div className={`mt-5 rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-slate-50'}`}>
        <p className="text-xs font-black uppercase tracking-wide">Action réalisée par</p>
        <p className="mt-2 text-sm font-bold">{modification.auteur}</p>
        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{modification.roleAuteur} / Chef : {modification.chefOperationnel?.nomComplet || 'Non applicable'}{modification.auteurEmail ? ` · ${modification.auteurEmail}` : ''}</p>
      </div>
      <dl className="mt-5 space-y-3">
        <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}><dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Résumé</dt><dd className="mt-1 text-sm font-semibold">{modification.detail || 'Modification enregistrée'}</dd></div>
        {Object.entries(modification.details || {}).map(([key, value]) => (
          <div key={key} className={`rounded-xl border p-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">{detailFieldLabels[key] || key.replaceAll('_', ' ')}</dt>
            <dd className={`mt-1 break-words text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{displayDetailValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  </div>
);

export default ModificationsPage;
