import React, { useState } from 'react';
import type { DAHierarchy } from '../../types';

interface EntryModalProps {
  defaultDate: string;
  hierarchyData: DAHierarchy;
  onClose: () => void;
  onSubmit: (payload: {
    entityId: string;
    date: string;
    stockJournalier: number;
    achat: number;
  }) => void;
}

function listWritableEntities(data: DAHierarchy) {
  const entities = data.da.map((da) => ({
    id: da.id,
    label: da.nom,
    path: `${data.nom} / ${da.nom}`,
  }));

  for (const da of data.da) {
    for (const dsm of da.dsm) {
      entities.push({
        id: dsm.id,
        label: dsm.nom,
        path: `${data.nom} / ${da.nom} / ${dsm.nom}`,
      });

      for (const pos of dsm.pos) {
        entities.push({
          id: pos.id,
          label: pos.nom,
          path: `${data.nom} / ${da.nom} / ${dsm.nom} / ${pos.nom}`,
        });
      }
    }
  }

  return entities;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  defaultDate,
  hierarchyData,
  onClose,
  onSubmit,
}) => {
  const entities = listWritableEntities(hierarchyData);
  const [entityId, setEntityId] = useState<string>(entities[0]?.id ?? '');
  const [date, setDate] = useState(defaultDate);
  const [stockJournalier, setStockJournalier] = useState('');
  const [achat, setAchat] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!stockJournalier || !achat) return;

    onSubmit({
      entityId,
      date,
      stockJournalier: Number(stockJournalier),
      achat: Number(achat),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="text-sm font-black text-slate-800">Saisie journalière</h2>
          <p className="mt-1 text-xs text-slate-500">
            L&apos;opérationnel renseigne le stock journalier et l&apos;achat du jour.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Entité concernée
            </label>
            <select
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-200"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.path}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Date de référence
            </label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-200"
            />
            <p className="mt-1 text-[10px] text-slate-500 font-medium">Dates passées ou futures autorisées</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Stock journalier (U)
              </label>
              <input
                type="number"
                min={0}
                value={stockJournalier}
                onChange={(event) => setStockJournalier(event.target.value)}
                placeholder="ex: 290"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Achat (U)
              </label>
              <input
                type="number"
                min={0}
                value={achat}
                onChange={(event) => setAchat(event.target.value)}
                placeholder="ex: 640"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!stockJournalier || !achat}
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};
