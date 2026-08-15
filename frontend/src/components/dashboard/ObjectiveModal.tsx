import React, { useEffect, useState } from 'react';

interface ObjectiveModalProps {
  isOpen: boolean;
  objective: number;
  monthLabel: string;
  onClose: () => void;
  onSubmit: (value: number) => void;
}

export const ObjectiveModal: React.FC<ObjectiveModalProps> = ({
  isOpen,
  objective,
  monthLabel,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState<number>(objective);

  useEffect(() => {
    if (isOpen) setValue(objective);
  }, [isOpen, objective]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Objectif mensuel</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">{monthLabel}</h2>
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
              Valeur cible (FCFA)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              value={value}
              onChange={(event) => setValue(Number(event.target.value.replace(/\D/g, '')) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-700">
            Stock de sécurité calculé : <span className="font-black">{((value / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 3).toLocaleString('fr-FR')} U</span>
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
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
