import React from 'react';
import type { AppRole } from '../../types';

export const RoleWorkspace: React.FC<{ role: AppRole }> = ({ role }) => {
  const isChef = role === 'CHEF_OPE';
  const title = isChef
    ? 'Suivi opérationnel du centre Chef opérationnel'
    : 'Saisie et suivi du périmètre affecté';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
        {isChef ? 'DA' : 'Périmètre affecté'}
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
        {title}
      </h2>

      {isChef && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <h3 className="font-bold text-violet-900">Validations de corrections</h3>
            <p className="mt-1 text-sm text-violet-700">
              Corrections soumises par les opérationnels à traiter.
            </p>
          </article>
          <article className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <h3 className="font-bold text-violet-900">Suivi des opérationnels</h3>
            <p className="mt-1 text-sm text-violet-700">
              Affectations et activité par partenaire.
            </p>
          </article>
        </div>
      )}
    </section>
  );
};

export default RoleWorkspace;
