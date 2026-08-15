import React, { useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Filter, Moon, SunMedium } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { AppRole } from '../types';

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
  | 'OPERATIONNEL_AFFECTE';

interface Modification {
  id: number;
  date: string;
  auteurId: number;
  auteur: string;
  roleAuteur: AppRole;
  type: ModificationType;
  partenaireId: number;
  partenaire: string;
  entite: string;
  detail: string;
  ancienneValeur?: string;
  nouvelleValeur?: string;
  statut: 'EFFECTUEE' | 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE';
}

const mockModifications: Modification[] = [
  {
    id: 1,
    date: '2026-08-13T09:25:00',
    auteurId: 1,
    auteur: 'Opérationnel Glotelho',
    roleAuteur: 'OPERATIONNEL',
    type: 'DSM_AJOUTE',
    partenaireId: 101,
    partenaire: 'Glotelho',
    entite: 'DSM Bonabéri',
    detail: 'Un DSM a été ajouté sous le partenaire Glotelho.',
    nouvelleValeur: 'DSM Bonabéri',
    statut: 'EFFECTUEE',
  },
  {
    id: 2,
    date: '2026-08-13T10:10:00',
    auteurId: 2,
    auteur: 'Chef Opérationnel CPDSM',
    roleAuteur: 'CHEF_OPE',
    type: 'CORRECTION_VALIDEE',
    partenaireId: 101,
    partenaire: 'Glotelho',
    entite: 'POS Marché Central',
    detail: 'Une correction de saisie journalière a été validée.',
    ancienneValeur: 'Achat : 640 U',
    nouvelleValeur: 'Achat : 720 U',
    statut: 'VALIDEE',
  },
  {
    id: 3,
    date: '2026-08-12T15:30:00',
    auteurId: 3,
    auteur: 'Chef Opérationnel CPDSM',
    roleAuteur: 'CHEF_OPE',
    type: 'OPERATIONNEL_AFFECTE',
    partenaireId: 102,
    partenaire: 'Master Color',
    entite: 'Mme Ngono',
    detail: 'Un opérationnel a été affecté au partenaire Master Color.',
    nouvelleValeur: 'Partenaire : Master Color',
    statut: 'EFFECTUEE',
  },
];

const labels: Record<ModificationType, string> = {
  DSM_AJOUTE: 'Ajout DSM',
  POS_AJOUTE: 'Ajout POS',
  POS_DEPLACE: 'Déplacement POS',
  SAISIE_CREEE: 'Saisie journalière',
  SAISIE_CORRIGEE: 'Correction de saisie',
  CORRECTION_VALIDEE: 'Validation de correction',
  OPERATIONNEL_AFFECTE: 'Affectation opérationnel',
};

const statusClasses = {
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

  const visibleModifications = useMemo(() => {
    const role = user?.role;
    const partenaireId = user?.partenaireId;

    return mockModifications.filter((modification) => {
      if (role === 'OPERATIONNEL') {
        return (
          modification.auteurId === user?.id &&
          modification.partenaireId === partenaireId
        );
      }

      return true;
    });
  }, [user]);

  const filteredModifications = useMemo(() => {
    const now = new Date('2026-08-13T23:59:59');

    return visibleModifications.filter((modification) => {
      const modificationDate = new Date(modification.date);
      const isToday =
        modificationDate.toISOString().slice(0, 10) === '2026-08-13';

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
    <div className={`min-h-screen p-6 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
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
                  <tr key={modification.id} className="border-b border-slate-100 last:border-0 hover:bg-sky-50/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                      {new Date(modification.date).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{modification.auteur}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{modification.roleAuteur}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">{labels[modification.type]}</span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{modification.partenaire}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{modification.entite}</td>

                    <td className="max-w-sm px-4 py-3">
                      <p className="text-xs text-slate-600">{modification.detail}</p>

                      {(modification.ancienneValeur || modification.nouvelleValeur) && (
                        <div className="mt-1 space-y-0.5 text-xs">
                          {modification.ancienneValeur && <p className="text-rose-600">Avant : {modification.ancienneValeur}</p>}
                          {modification.nouvelleValeur && <p className="text-emerald-600">Après : {modification.nouvelleValeur}</p>}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClasses[modification.statut]}`}>
                        {modification.statut}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredModifications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      Aucune modification ne correspond aux filtres choisis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModificationsPage;
