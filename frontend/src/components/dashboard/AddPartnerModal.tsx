import React, { useEffect, useMemo, useState } from 'react';
import { Info, MapPin, Network, Smartphone, X } from 'lucide-react';
import type { AddPartnerPayload } from '../../types';

interface AddPartnerModalProps {
  isOpen: boolean;
  isDark?: boolean;
  onClose: () => void;
  onSubmit: (payload: AddPartnerPayload) => Promise<void> | void;
}

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

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('237') ? digits.slice(3) : digits;
}

function normalizeCode(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/^MASTER_SIM_ZONE_/, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({
  isOpen,
  isDark = false,
  onClose,
  onSubmit,
}) => {
  const [nom, setNom] = useState('');
  const [masterSim, setMasterSim] = useState('');
  const [region, setRegion] = useState('');
  const [codeZone, setCodeZone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const normalizedPhone = useMemo(() => normalizePhone(masterSim), [masterSim]);
  const normalizedZone = useMemo(() => normalizeCode(codeZone), [codeZone]);
  const networkName = normalizedPhone && normalizedZone
    ? `${normalizedPhone} - MASTER_SIM_ZONE_${normalizedZone}`
    : 'Le nom réseau sera généré automatiquement';

  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    setSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setNom('');
    setMasterSim('');
    setRegion('');
    setCodeZone('');
    setFormError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!/^6\d{8}$/.test(normalizedPhone)) {
      setFormError('La Master SIM doit contenir 9 chiffres et commencer par 6.');
      return;
    }
    if (!normalizedZone || !/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/.test(normalizedZone)) {
      setFormError('Le code zone est invalide. Exemple attendu : LITTORAL_1.');
      return;
    }
    const payload: AddPartnerPayload = {
      nom: nom.trim(),
      masterSim: normalizedPhone,
      region,
      codeZone: normalizedZone,
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Création du partenaire impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-sky-500 focus:ring-2 ${
    isDark
      ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:ring-sky-500/30'
      : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-sky-100'
  }`;
  const labelClass = `mb-1.5 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
        isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? 'bg-sky-500/15' : 'bg-sky-50'}`}>
              <Network className="h-5 w-5 text-sky-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Niveau 4 · Master SIM</p>
              <h2 className="mt-1 text-xl font-black">Ajouter un partenaire</h2>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Le Chef crée le partenaire. Son équipe sera affectée séparément ensuite.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`cursor-pointer rounded-lg p-2 transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            aria-label="Fermer la fenêtre"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="partner-name" className={labelClass}>Nom du partenaire <span className="text-rose-500">*</span></label>
            <input
              id="partner-name"
              type="text"
              required
              value={nom}
              onChange={(event) => setNom(event.target.value)}
              placeholder="Ex. Glotelho"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="partner-region" className={labelClass}>Région <span className="text-rose-500">*</span></label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="partner-region"
                  required
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className={`${inputClass} pl-9`}
                >
                  <option value="">Sélectionner…</option>
                  {CAMEROON_REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="partner-zone" className={labelClass}>Code zone <span className="text-rose-500">*</span></label>
              <input
                id="partner-zone"
                type="text"
                required
                value={codeZone}
                onChange={(event) => setCodeZone(event.target.value)}
                placeholder="Ex. LITTORAL_1"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="partner-master-sim" className={labelClass}>Numéro de la Master SIM <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="partner-master-sim"
                type="tel"
                inputMode="numeric"
                required
                value={masterSim}
                onChange={(event) => setMasterSim(event.target.value)}
                placeholder="Ex. 620473545"
                className={`${inputClass} pl-9 font-mono`}
              />
            </div>
          </div>

          <div className={`rounded-xl border p-3 ${isDark ? 'border-sky-500/30 bg-sky-500/10' : 'border-sky-200 bg-sky-50'}`}>
            <p className={`text-[10px] font-black uppercase tracking-wide ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Nom réseau généré</p>
            <p className={`mt-1 break-all font-mono text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{networkName}</p>
          </div>

          <div className={`flex gap-3 rounded-xl border p-3 ${isDark ? 'border-sky-500/30 bg-sky-500/10 text-sky-200' : 'border-sky-200 bg-sky-50 text-sky-800'}`}>
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-xs font-semibold leading-5">
              Aucune affectation automatique ne sera créée. Après l’enregistrement, utilisez « Gérer les affectations » pour choisir un ou plusieurs opérationnels.
            </p>
          </div>

          {formError && (
            <div role="alert" className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Enregistrement…' : 'Créer le partenaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPartnerModal;
