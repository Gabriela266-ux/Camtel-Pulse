import React from 'react';
import type { DANode, OperationalAssignment, Operationnel } from '../../types';
import type { User } from '../../auth/AuthContext';

interface RoleWorkspaceProps {
  role: string;
  user?: User | null;
  operationnels?: Operationnel[];
  assignments?: OperationalAssignment[];
  partners?: DANode[];
}

function listScopes(assignments: OperationalAssignment[]): string {
  const scopes = assignments.map((a) => a.partenaireNom).filter(Boolean);
  return scopes.length > 0 ? [...new Set(scopes)].join(', ') : 'Aucun périmètre affecté';
}

export const RoleWorkspace: React.FC<RoleWorkspaceProps> = ({
  role,
  user,
  operationnels = [],
  assignments = [],
  partners = [],
}) => {
  const totalPartners = partners.length;
  const totalOperationnels = operationnels.length;
  const totalAssignments = assignments.length;
  const scopeLabel = listScopes(assignments);

  const userPartner = user?.partenaireId
    ? partners.find((p) => p.id === user.partenaireId)
    : undefined;

  const isChef = role === 'CHEF_OPE';

  if (role === 'ADMIN') {
    return (
      <Card role="ADMIN" label="Administrateur" title="Console d'administration">
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            label="Opérationnels"
            value={String(totalOperationnels)}
            hint={`${totalAssignments} affectation(s) enregistrée(s)`}
          />
          <StatCard
            label="Partenaires"
            value={String(totalPartners)}
            hint="Partenaires & POS sous le centre"
          />
        </div>
      </Card>
    );
  }

  if (role === 'MANAGER') {
    return (
      <Card role="MANAGER" label="Manager" title="Vue de pilotage manager">
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            label="Opérationnels suivis"
            value={String(totalOperationnels)}
            hint="Lecture seule sur tous les indicateurs"
          />
          <StatCard
            label="Périmètres"
            value={String(totalPartners)}
            hint={scopeLabel}
          />
        </div>
      </Card>
    );
  }

  if (isChef) {
    return (
      <Card role="CHEF_OPE" label="Chef opérationnel" title="Suivi opérationnel du centre">
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            label="Opérationnels affectés"
            value={String(totalAssignments)}
            hint={scopeLabel}
          />
          <StatCard
            label="Partenaires sous responsabilité"
            value={String(totalPartners)}
            hint="Partenaires & POS du centre"
          />
        </div>

        {assignments.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-violet-700">
              Opérationnels et périmètres
            </h3>
            <ul className="space-y-2">
              {assignments.map((assignment) => {
                const partner =
                  partners.find((p) => p.id === assignment.partenaireId) ?? null;
                const scopeInfo = assignment.dsmId
                  ? `DSM : ${partner?.dsm.find((d) => d.id === assignment.dsmId)?.nom ?? assignment.dsmId}`
                  : `Périmètre : ${assignment.partenaireNom}`;

                return (
                  <li
                    key={assignment.userId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5"
                  >
                    <span className="text-sm font-bold text-violet-900">
                      {assignment.nomComplet}
                    </span>
                    <span className="text-xs text-violet-700">{scopeInfo}</span>
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
      </Card>
    );
  }

  // OPERATIONNEL — périmètre affecté (partenaire de l'utilisateur connecté).
  return (
    <Card role="OPERATIONNEL" label="Opérationnel" title="Saisie et suivi du périmètre affecté">
      <div className="grid gap-3 md:grid-cols-2">
        <StatCard
          label="Partenaire affecté"
          value={userPartner?.nom ?? '—'}
          hint={
            user?.partenaireId
              ? 'Accès limité à ce partenaire'
              : 'Aucun partenaire affecté'
          }
        />
      </div>
    </Card>
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
      return 'border-l-violet-600';
    default:
      return 'border-l-emerald-600';
  }
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </article>
  );
}

export default RoleWorkspace;