import React, { useMemo, useState } from 'react';
import type { DANode, OperationalAssignment } from '../../types';

interface AssignmentModalProps {
  assignment: OperationalAssignment;
  partners: DANode[];
  onClose: () => void;
  onSubmit: (updatedAssignment: OperationalAssignment) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  assignment,
  partners,
  onClose,
  onSubmit,
}) => {
  const [partenaireId, setPartenaireId] = useState<string>(assignment.partenaireId);
  const [dsmId, setDsmId] = useState<string | undefined>(assignment.dsmId);
  const [posId, setPosId] = useState<string | undefined>(assignment.posId);

  const partner = useMemo(
    () => partners.find((item) => item.id === partenaireId) ?? partners[0],
    [partners, partenaireId],
  );

  const dsmOptions = partner?.dsm ?? [];
  const selectedDsm = dsmOptions.find((item) => item.id === dsmId) ?? dsmOptions[0];
  const posOptions = selectedDsm?.pos ?? [];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const partnerName = partners.find((item) => item.id === partenaireId)?.nom ?? assignment.partenaireNom;

    onSubmit({
      ...assignment,
      partenaireId,
      partenaireNom: partnerName,
      dsmId: dsmOptions.length > 0 ? dsmId ?? selectedDsm?.id : undefined,
      posId: posOptions.length > 0 ? posId ?? posOptions[0]?.id : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Affectation</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Changer poste</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer la modale"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Opérationnel</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{assignment.nomComplet}</p>
            <p className="mt-1 text-xs text-slate-500">
              Poste actuel : Opérationnel — {assignment.partenaireNom}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Nouveau partenaire
            </label>
            <select
              value={partenaireId}
              onChange={(event) => {
                const nextPartnerId = event.target.value;
                setPartenaireId(nextPartnerId);
                const nextPartner = partners.find((item) => item.id === nextPartnerId);
                if (nextPartner?.dsm.length) {
                  setDsmId(nextPartner.dsm[0].id);
                  setPosId(nextPartner.dsm[0].pos[0]?.id);
                } else {
                  setDsmId(undefined);
                  setPosId(undefined);
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.nom}
                </option>
              ))}
            </select>
          </div>

          {dsmOptions.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                DSM précis (optionnel)
              </label>
              <select
                value={dsmId ?? ''}
                onChange={(event) => {
                  const nextDsmId = event.target.value || undefined;
                  setDsmId(nextDsmId);
                  const nextDsm = dsmOptions.find((item) => item.id === nextDsmId);
                  setPosId(nextDsm?.pos[0]?.id ?? undefined);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Affectation globale au partenaire</option>
                {dsmOptions.map((dsm) => (
                  <option key={dsm.id} value={dsm.id}>
                    {dsm.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {posOptions.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                POS précis (optionnel)
              </label>
              <select
                value={posId ?? ''}
                onChange={(event) => setPosId(event.target.value || undefined)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Non spécifié</option>
                {posOptions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
            >
              Enregistrer l’affectation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
