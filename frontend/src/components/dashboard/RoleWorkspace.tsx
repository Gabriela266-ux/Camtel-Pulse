import React from 'react';
import { ShieldCheck, UserCheck, UserCog, UserX } from 'lucide-react';
import type { DANode, DailyRecord, OperationalAssignment, Operationnel } from '../../types';
import type { User } from '../../auth/authState';

interface RoleWorkspaceProps {
  role: string;
  user?: User | null;
  operationnels?: Operationnel[];
  assignments?: OperationalAssignment[];
  userAccounts?: Array<{ id: string; nom_complet: string; email?: string; matricule?: string; statut: string; role?: { libelle?: string }; poste?: { libelle?: string }; centre?: { nom_centre?: string; code_centre?: string } }>;
  partners?: DANode[];
  records?: DailyRecord[];
  onReassign?: (assignment: OperationalAssignment) => void;
  onToggleStatus?: (assignment: OperationalAssignment) => void;
}

function listScopes(assignments: OperationalAssignment[]): string {
  const scopes = assignments.flatMap((assignment) => assignment.partenaires?.map((partner) => partner.nom) ?? []);
  return scopes.length > 0 ? [...new Set(scopes)].join(', ') : 'Aucun périmètre affecté';
}

export const RoleWorkspace: React.FC<RoleWorkspaceProps> = ({
  role,
  user,
  operationnels = [],
  assignments = [],
  userAccounts = [],
  partners = [],
  records = [],
  onReassign,
  onToggleStatus,
}) => {
  const totalPartners = partners.length;
  const totalOperationnels = operationnels.length;
  const scopeLabel = listScopes(assignments);

  const userPartnerIds = user?.partenaireIds?.length
    ? user.partenaireIds
    : user?.partenaireId ? [user.partenaireId] : [];
  const userPartners = partners.filter((partner) => userPartnerIds.includes(partner.id));

  const isChef = role === 'CHEF_OPE';

  if (role === 'ADMIN' || role === 'MANAGER') {
    const isAdmin = role === 'ADMIN';
    return (
      <Card
        role={role}
        label={isAdmin ? 'Administrateur' : 'Manager'}
        title={isAdmin ? 'Vue de supervision administrateur' : 'Vue de pilotage manager'}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            label="Opérationnels suivis"
            value={String(totalOperationnels)}
            hint="Consultation de tous les indicateurs"
          />
          <StatCard
            label="Périmètres"
            value={String(totalPartners)}
            hint={scopeLabel}
          />
        </div>
        {isAdmin && (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Ce dashboard est en lecture seule. Les actions techniques restent disponibles dans l’espace Administration.
          </p>
        )}
        {!isAdmin && (
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead><tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800"><th className="px-3 py-2.5">Opérationnel</th><th className="px-3 py-2.5">Rôle / Chef</th><th className="px-3 py-2.5">Périmètres</th><th className="px-3 py-2.5">Statut</th></tr></thead>
              <tbody>{assignments.map((assignment) => <tr key={assignment.userId} className="border-t border-slate-100 dark:border-slate-700"><td className="px-3 py-3"><p className="font-black text-slate-800 dark:text-slate-100">{assignment.nomComplet?.trim() || assignment.email || 'Identité indisponible'}</p><p className="mt-0.5 text-[11px] text-slate-500">{assignment.email}</p></td><td className="px-3 py-3"><p className="font-bold text-sky-700 dark:text-sky-300">Opérationnel</p><p className="mt-0.5 text-[11px] text-slate-500">Chef / {assignment.chefOperationnel?.nomComplet || 'Non rattaché'}</p></td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{assignment.partenaires?.map((partner) => partner.nom).join(', ') || 'Aucun périmètre'}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 font-bold ${assignment.statut === 'suspendu' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{assignment.statut === 'suspendu' ? 'Suspendu' : 'Actif'}</span></td></tr>)}</tbody>
            </table>
            {assignments.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun opérationnel n’est encore rattaché aux équipes de ce centre.</p>}
          </div>
        )}
        {!isAdmin && (
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="border-b border-slate-100 px-3 py-3 text-xs font-black uppercase tracking-wide text-sky-700 dark:border-slate-700 dark:text-sky-300">
              Tous les utilisateurs et sous-utilisateurs
            </div>
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead><tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800"><th className="px-3 py-2.5">Nom complet</th><th className="px-3 py-2.5">Matricule / email</th><th className="px-3 py-2.5">Poste</th><th className="px-3 py-2.5">Centre de travail</th><th className="px-3 py-2.5">Statut</th></tr></thead>
              <tbody>{userAccounts.map((account) => <tr key={account.id} className="border-t border-slate-100 dark:border-slate-700"><td className="px-3 py-3 font-black text-slate-800 dark:text-slate-100">{account.nom_complet || 'Identité indisponible'}</td><td className="px-3 py-3"><p className="font-mono text-slate-700 dark:text-slate-300">{account.matricule || '—'}</p><p className="text-[11px] text-slate-500">{account.email || '—'}</p></td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{account.poste?.libelle || account.role?.libelle || '—'}</td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{account.centre?.nom_centre || account.centre?.code_centre || '—'}</td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{account.statut}</span></td></tr>)}</tbody>
            </table>
            {userAccounts.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun compte à afficher.</p>}
          </div>
        )}
      </Card>
    );
  }

  if (isChef) {
    const activeAssignments = assignments
      .filter((assignment) => assignment.statut !== 'suspendu' && assignment.statut !== 'inactif')
      .reduce((sum, assignment) => sum + (assignment.partenaireIds?.length ?? 0), 0);
    const suspendedAssignments = assignments.filter((assignment) => assignment.statut === 'suspendu').length;
    return (
      <section id="gestion-operationnels" className="scroll-mt-6 rounded-2xl border border-slate-200 border-l-4 border-l-sky-600 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-wide text-sky-700">Chef opérationnel</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Gestion des opérationnels</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">Pilotez l’équipe, ses affectations et la disponibilité de chaque opérationnel sur le réseau.</p></div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"><ShieldCheck className="h-4 w-4" /> Périmètre sécurisé</div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<UserCog className="h-4 w-4" />} label="Équipe" value={String(totalOperationnels)} hint="Comptes validés et actifs" />
          <StatCard icon={<UserCheck className="h-4 w-4" />} label="Affectations actives" value={String(activeAssignments)} hint="Opérationnels en activité" />
          <StatCard icon={<UserX className="h-4 w-4" />} label="Suspendus" value={String(suspendedAssignments)} hint="Réactivation disponible" />
          <StatCard
            label="Partenaires sous responsabilité"
            value={String(totalPartners)}
            hint="Périmètres attribuables"
          />
        </div>

        {assignments.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-sky-700">
              Équipe et périmètres d’affectation
            </h3>
            <ul className="space-y-2">
              {assignments.map((assignment) => {
                const isSuspended = assignment.statut === 'suspendu';
                const assignedPartners = assignment.partenaires ?? [];

                return (
                  <li
                    key={assignment.userId}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 ${
                      isSuspended
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-sky-200 bg-sky-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-bold ${isSuspended ? 'text-amber-800' : 'text-sky-900'}`}>
                        {assignment.nomComplet?.trim() || assignment.email || 'Opérationnel sans identité'}
                      </span>
                      {isSuspended && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                          Suspendu
                        </span>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {assignedPartners.length > 0 ? assignedPartners.map((partner) => (
                          <span key={partner.id} className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300">
                            {partner.nom}
                          </span>
                        )) : (
                          <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Non affecté</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {onReassign && (
                        <button
                          type="button"
                          onClick={() => onReassign(assignment)}
                          className="rounded-lg border border-sky-300 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50"
                        >
                          Gérer les affectations
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(assignment)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                            isSuspended
                              ? 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
                              : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          {isSuspended ? 'Réactiver' : 'Suspendre'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {assignments.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">
            Aucun opérationnel affecté pour le moment.
          </p>
        )}
      </section>
    );
  }

  // OPERATIONNEL — périmètre affecté (partenaire de l'utilisateur connecté).
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((record) => record.date === todayStr);
  const partnerName = userPartners.length ? userPartners.map((partner) => partner.nom).join(', ') : 'Aucun partenaire affecté';
  const achatValue = todayRecord
    ? `${(todayRecord.achat ?? 0).toLocaleString('fr-FR')} U`
    : 'À saisir';
  // Demandes de correction : aucune source API dédiée n'est encore branchée côté frontend.
  // La valeur reste dynamique et s'appuie sur les props quand le backend la fournira (champ
  // optionnel `corrections` documenté dans Directives_API_Backend.md).
  type DailyRecordWithCorrections = DailyRecord & { corrections?: number };
  const recordWithCorrections = records.find(
    (record) => typeof (record as DailyRecordWithCorrections).corrections === 'number',
  );
  const correctionsValue = recordWithCorrections
    ? String((recordWithCorrections as DailyRecordWithCorrections).corrections!)
    : '0';

  return (
    <section className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-600 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-black tracking-tight text-slate-900">
              Saisie et suivi du périmètre affecté
            </h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              Opérationnel
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Accès limité au partenaire affecté, avec saisie du stock journalier et de l&apos;Achat (U).
          </p>
        </div>
        <span className="whitespace-nowrap text-xs text-slate-400">
          {userPartners.length} partenaire(s) affecté(s)
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* PÉRIMÈTRE */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Périmètre</div>
          <div className="mt-1 text-sm font-black text-slate-800">{partnerName}</div>
          {userPartners.length > 0 ? (
            <div className="mt-2 rounded-lg border border-sky-100 bg-sky-100 px-2.5 py-2 text-xs leading-snug text-sky-600">
              Accès limité aux partenaires explicitement affectés
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-slate-500">Saisie limitée au partenaire affecté</div>
          )}
        </div>

        {/* ACHAT */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Achat</div>
          <div className="mt-1 text-sm font-black text-slate-800">{achatValue}</div>
          <div className="mt-0.5 text-xs text-slate-500">Achat du jour et suivi de correction</div>
        </div>

        {/* CORRECTIONS */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Corrections</div>
          <div className="mt-1 text-sm font-black text-slate-800">{correctionsValue}</div>
          <div className="mt-0.5 text-xs text-slate-500">Au-delà, demande validée par le chef</div>
        </div>
      </div>
    </section>
  );
};
// --- Sous-composants d'habillage ---

function Card({
  role,
  title,
  label,
  children,
}: {
  role: string;
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${borderFor(role)}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function borderFor(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'border-l-sky-600';
    case 'MANAGER':
      return 'border-l-slate-600';
    case 'CHEF_OPE':
    case 'CHEF_OPERATIONNEL':
      return 'border-l-sky-600';
    default:
      return 'border-l-emerald-600';
  }
}

function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">{icon}<p className="text-xs font-black uppercase tracking-wide">{label}</p></div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </article>
  );
}

export default RoleWorkspace;
