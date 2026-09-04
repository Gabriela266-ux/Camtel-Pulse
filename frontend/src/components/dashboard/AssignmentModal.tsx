import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, UsersRound, X } from 'lucide-react';
import type { DANode, OperationalAssignment } from '../../types';

interface AssignmentModalProps {
  assignment: OperationalAssignment;
  partners: DANode[];
  isDark?: boolean;
  onClose: () => void;
  onSubmit: (updatedAssignment: OperationalAssignment) => Promise<void> | void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ assignment, partners, isDark = false, onClose, onSubmit }) => {
  const initialIds = assignment.partenaireIds?.length
    ? assignment.partenaireIds
    : assignment.partenaireId ? [assignment.partenaireId] : [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  const visiblePartners = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    if (!query) return partners;
    return partners.filter((partner) => [partner.nom, partner.code, partner.code_zone, partner.numero_sim, partner.region]
      .some((value) => String(value || '').toLocaleLowerCase('fr').includes(query)));
  }, [partners, search]);

  const togglePartner = (partnerId: string) => {
    setSelectedIds((current) => current.includes(partnerId)
      ? current.filter((id) => id !== partnerId)
      : [...current, partnerId]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const selectedPartners = partners
        .filter((partner) => selectedIds.includes(partner.id))
        .map((partner) => ({ id: partner.id, nom: partner.nom, code: partner.code, statut: 'actif' }));
      await onSubmit({
        ...assignment,
        partenaireIds: selectedIds,
        partenaires: selectedPartners,
        partenaireId: selectedIds[0],
        partenaireNom: selectedPartners[0]?.nom,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Affectation impossible');
    } finally {
      setSaving(false);
    }
  };

  const panelClass = isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" className={`max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${panelClass}`}>
        <div className={`flex items-start justify-between gap-4 border-b p-5 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>
              <UsersRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Gestion d’équipe</p>
              <h2 id="assignment-modal-title" className="mt-1 text-xl font-black">Gérer les affectations</h2>
              <p className={`mt-1 text-xs ${mutedClass}`}>{assignment.nomComplet?.trim() || assignment.email || 'Opérationnel sans identité'} · {selectedIds.length} partenaire(s)</p>
            </div>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} disabled={saving} className={`cursor-pointer rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`} aria-label="Fermer la fenêtre d’affectation">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <p className={`mb-4 text-xs font-semibold leading-5 ${mutedClass}`}>Cochez uniquement les partenaires que cet opérationnel doit gérer. Un même partenaire peut être confié à plusieurs opérationnels. Aucune case cochée signifie « non affecté ».</p>
            <label htmlFor="assignment-search" className="sr-only">Rechercher un partenaire</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input id="assignment-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, code, zone, région ou Master SIM…" className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:ring-sky-500/30' : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-sky-100'}`} />
            </div>

            <fieldset className="mt-4 max-h-[42vh] space-y-2 overflow-y-auto pr-1">
              <legend className="sr-only">Partenaires attribués</legend>
              {visiblePartners.map((partner) => {
                const checked = selectedIds.includes(partner.id);
                return (
                  <label key={partner.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${checked ? isDark ? 'border-sky-500/50 bg-sky-500/10' : 'border-sky-300 bg-sky-50' : isDark ? 'border-slate-700 bg-slate-800/70 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-sky-200'}`}>
                    <input type="checkbox" checked={checked} onChange={() => togglePartner(partner.id)} className="sr-only" />
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-sky-600 bg-sky-600 text-white' : isDark ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                      {checked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{partner.nom}</span>
                      <span className={`mt-0.5 block truncate font-mono text-[11px] ${mutedClass}`}>{[partner.code, partner.code_zone, partner.numero_sim].filter(Boolean).join(' · ') || 'Identifiants réseau non renseignés'}</span>
                    </span>
                  </label>
                );
              })}
              {visiblePartners.length === 0 && <p className={`rounded-xl border border-dashed p-6 text-center text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>Aucun partenaire ne correspond à la recherche.</p>}
            </fieldset>
            {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-slate-50/70'}`}>
            <span className={`text-xs font-bold ${mutedClass}`}>{selectedIds.length} partenaire(s) sélectionné(s)</span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} disabled={saving} className={`cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>Annuler</button>
              <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer les affectations'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
