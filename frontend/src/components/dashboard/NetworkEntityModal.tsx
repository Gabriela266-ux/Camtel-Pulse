import React, { useEffect, useMemo, useState } from 'react';
import { Network, Smartphone, Store, X } from 'lucide-react';
import type { CreateDsmPayload, CreatePosPayload } from '../../types';

export type NetworkEntityContext =
  | {
      type: 'DSM';
      daId: string;
      partnerName: string;
      partnerZone?: string;
    }
  | {
      type: 'POS';
      dsmId: string;
      dsmName: string;
      codeDsm: string;
      codeZone: string;
    };

interface NetworkEntityModalProps {
  context: NetworkEntityContext | null;
  isDark?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDsmPayload | CreatePosPayload) => Promise<void>;
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('237') ? digits.slice(3) : digits;
}

function normalizeSimpleCode(value: string): string {
  return value.toUpperCase().replace(/[\s_-]+/g, '');
}

function normalizeZoneCode(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export const NetworkEntityModal: React.FC<NetworkEntityModalProps> = ({
  context,
  isDark = false,
  onClose,
  onSubmit,
}) => {
  const [nom, setNom] = useState('');
  const [numero, setNumero] = useState('');
  const [codeDsm, setCodeDsm] = useState('');
  const [codeZone, setCodeZone] = useState('');
  const [codePos, setCodePos] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!context) return;
    setNom('');
    setNumero('');
    setCodeDsm('');
    setCodeZone(context.type === 'DSM' ? '' : context.codeZone);
    setCodePos('');
    setSubmitting(false);
    setFormError('');
  }, [context]);

  const phone = useMemo(() => normalizePhone(numero), [numero]);
  const normalizedDsmCode = useMemo(
    () => context?.type === 'POS' ? context.codeDsm : normalizeSimpleCode(codeDsm),
    [codeDsm, context],
  );
  const normalizedZoneCode = useMemo(
    () => context?.type === 'POS' ? context.codeZone : normalizeZoneCode(codeZone),
    [codeZone, context],
  );
  const normalizedPosCode = useMemo(() => normalizeSimpleCode(codePos), [codePos]);

  if (!context) return null;

  const networkCode = context.type === 'DSM'
    ? `${normalizedDsmCode || 'DSM…'}_${normalizedZoneCode || 'ZONE…'}`
    : `${normalizedPosCode || 'POS…'}_${normalizedDsmCode}_${normalizedZoneCode}`;
  const networkName = phone ? `${phone} - ${networkCode}` : `Numéro - ${networkCode}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!/^6\d{8}$/.test(phone)) {
      setFormError('Le numéro doit contenir 9 chiffres et commencer par 6.');
      return;
    }
    if (context.type === 'DSM') {
      if (!nom.trim()) {
        setFormError('Le nom du DSM est obligatoire.');
        return;
      }
      if (!/^DSM[A-Z0-9]+$/.test(normalizedDsmCode)) {
        setFormError('Le code DSM doit commencer par DSM, par exemple DSM1.');
        return;
      }
      if (!normalizedZoneCode) {
        setFormError('Le code zone du DSM est obligatoire, par exemple LT1.');
        return;
      }
    } else if (!/^POS[A-Z0-9]+$/.test(normalizedPosCode)) {
      setFormError('Le code POS doit commencer par POS, par exemple POS274.');
      return;
    }

    try {
      setSubmitting(true);
      if (context.type === 'DSM') {
        await onSubmit({
          da_id: context.daId,
          nom: nom.trim(),
          numero_telephone: phone,
          code_dsm: normalizedDsmCode,
          code_zone: normalizedZoneCode,
        });
      } else {
        await onSubmit({
          dsm_id: context.dsmId,
          numero_telephone: phone,
          code_pos: normalizedPosCode,
        });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Création impossible.');
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
      <div className={`max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
        isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? 'bg-sky-500/15' : 'bg-sky-50'}`}>
              {context.type === 'DSM'
                ? <Network className="h-5 w-5 text-sky-600" />
                : <Store className="h-5 w-5 text-sky-600" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                Niveau {context.type === 'DSM' ? '5' : '6'} · {context.type}
              </p>
              <h2 className="mt-1 text-xl font-black">Ajouter un {context.type}</h2>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Sous {context.type === 'DSM' ? context.partnerName : context.dsmName}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {context.type === 'DSM' && (
            <div>
              <label htmlFor="network-dsm-name" className={labelClass}>Nom du DSM <span className="text-rose-500">*</span></label>
              <input
                id="network-dsm-name"
                required
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                placeholder="Ex. DSM Glotelho 1"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="network-phone" className={labelClass}>Numéro {context.type} <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="network-phone"
                type="tel"
                inputMode="numeric"
                required
                value={numero}
                onChange={(event) => setNumero(event.target.value)}
                placeholder="Ex. 620473546"
                className={`${inputClass} pl-9 font-mono`}
              />
            </div>
          </div>

          {context.type === 'DSM' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="network-dsm-code" className={labelClass}>Code DSM <span className="text-rose-500">*</span></label>
                <input
                  id="network-dsm-code"
                  required
                  value={codeDsm}
                  onChange={(event) => setCodeDsm(event.target.value)}
                  placeholder="Ex. DSM1"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
              <div>
                <label htmlFor="network-zone-code" className={labelClass}>Code zone <span className="text-rose-500">*</span></label>
                <input
                  id="network-zone-code"
                  required
                  value={codeZone}
                  onChange={(event) => setCodeZone(event.target.value)}
                  placeholder="Ex. LT1"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="network-pos-code" className={labelClass}>Code POS <span className="text-rose-500">*</span></label>
                <input
                  id="network-pos-code"
                  required
                  value={codePos}
                  onChange={(event) => setCodePos(event.target.value)}
                  placeholder="Ex. POS274"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
              <div className={`grid gap-3 rounded-xl border p-3 sm:grid-cols-2 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-slate-50'}`}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">DSM hérité</p>
                  <p className="mt-1 font-mono text-xs font-bold">{context.codeDsm}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Zone héritée</p>
                  <p className="mt-1 font-mono text-xs font-bold">{context.codeZone}</p>
                </div>
              </div>
            </>
          )}

          <div className={`rounded-xl border p-3 ${isDark ? 'border-sky-500/30 bg-sky-500/10' : 'border-sky-200 bg-sky-50'}`}>
            <p className={`text-[10px] font-black uppercase tracking-wide ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Nom réseau généré</p>
            <p className={`mt-1 break-all font-mono text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{networkName}</p>
          </div>

          {formError && (
            <div role="alert" className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {formError}
            </div>
          )}

          <div className={`flex justify-end gap-2 border-t pt-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
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
              {submitting ? 'Enregistrement…' : `Créer le ${context.type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
