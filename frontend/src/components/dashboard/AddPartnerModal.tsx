import React, { useState } from 'react';
import type { AddPartnerPayload, Operationnel } from '../../types';

interface AddPartnerModalProps {
  isOpen: boolean;
  operationnels: Operationnel[];
  chefName?: string;
  isDark?: boolean;
  onClose: () => void;
  onSubmit: (payload: AddPartnerPayload) => void;
}

const CHEF_OPTION = '__CHEF__';
const CAMEROON_REGIONS = [
  'Adamaoua',
  'Centre',
  'Est',
  'Extrême-Nord',
  'Littoral',
  'Nord',
  'Nord-Ouest',
  'Ouest',
  'Sud',
  'Sud-Ouest',
];

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({
  isOpen,
  operationnels,
  isDark = false,
  onClose,
  onSubmit,
}) => {
  const [nom, setNom] = useState('');
  const [masterSim, setMasterSim] = useState('');
  const [region, setRegion] = useState('');
  const [attribution, setAttribution] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nom.trim() || !region) return;

    const payload: AddPartnerPayload = {
      nom: nom.trim(),
      masterSim: masterSim.trim(),
      region,
      attribution:
        attribution === CHEF_OPTION
          ? { type: 'CHEF' }
          : { type: 'OPERATIONNEL', userId: attribution },
    };

    onSubmit(payload);
    setNom('');
    setMasterSim('');
    setRegion('');
    setAttribution('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><img src="/logo-camtel.png" alt="CAMTEL" className="h-10 w-10 rounded-lg object-contain" /><div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Réseau</p>
            <h2 className={`mt-1 text-xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Ajouter un partenaire</h2>
          </div></div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-2 py-1 text-sm font-bold ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            aria-label="Fermer la modale"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Nom du partenaire <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(event) => setNom(event.target.value)}
              placeholder="Ex : Partenaire..."
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
            />
          </div>

          <div>
            <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Région <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
            >
              <option value="">— Sélectionner la région —</option>
              {CAMEROON_REGIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Master SIM <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={masterSim}
              onChange={(event) => setMasterSim(event.target.value)}
              placeholder="Ex : SIM-GLO-0001"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
            />
          </div>

          <div>
            <label className={`mb-1 block text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Attribuer à <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={attribution}
              onChange={(event) => setAttribution(event.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
            >
              <option value="">— Sélectionner le responsable —</option>
              {operationnels.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nom_complet?.trim() || op.email || 'Opérationnel sans identité'}
                </option>
              ))}
              <option value={CHEF_OPTION}>Gérer moi-même (Chef Opérationnel)</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Choisissez un opérationnel du centre ou gérez ce partenaire vous-même.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg border px-4 py-2 text-xs font-bold ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700"
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
