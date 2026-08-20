import React, { useState } from 'react';
import type { AddPartnerPayload, Operationnel } from '../../types';

interface AddPartnerModalProps {
  isOpen: boolean;
  operationnels: Operationnel[];
  onClose: () => void;
  onSubmit: (payload: AddPartnerPayload) => void;
}

const CHEF_OPTION = '__CHEF__';

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({
  isOpen,
  operationnels,
  onClose,
  onSubmit,
}) => {
  const [nom, setNom] = useState('');
  const [masterSim, setMasterSim] = useState('');
  const [attribution, setAttribution] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nom.trim()) return;

    const payload: AddPartnerPayload = {
      nom: nom.trim(),
      masterSim: masterSim.trim() || undefined,
      attribution:
        attribution === CHEF_OPTION
          ? { type: 'CHEF' }
          : { type: 'OPERATIONNEL', userId: attribution },
    };

    onSubmit(payload);
    setNom('');
    setMasterSim('');
    setAttribution('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Réseau</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Ajouter un partenaire</h2>
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
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Nom du partenaire <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(event) => setNom(event.target.value)}
              placeholder="Ex : Glotelho, Master Color…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Master SIM <span className="text-slate-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={masterSim}
              onChange={(event) => setMasterSim(event.target.value)}
              placeholder="Ex : SIM-GLO-0001"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Attribuer à <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={attribution}
              onChange={(event) => setAttribution(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">— Sélectionner le responsable —</option>
              {operationnels.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nom_complet}
                </option>
              ))}
              <option value={CHEF_OPTION}>Gérer moi-même</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Choisissez un opérationnel du centre ou gérez ce partenaire vous-même.
            </p>
          </div>

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
              Ajouter le partenaire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPartnerModal;