import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../../api/services';
import type { EntityType } from '../../types';

interface EntryModalProps {
  defaultDate: string;
  entityName: string;
  defaultEntityId: string;
  defaultEntityType: EntityType;
  onClose: () => void;
  onSubmit: (payload: {
    entityId: string;
    entityType: EntityType;
    date: string;
    stockJournalier: number;
    achat: number;
  }) => Promise<void> | void;
}

function shiftDate(value: string, amount: number) {
  const current = new Date(`${value}T00:00:00Z`);
  current.setUTCDate(current.getUTCDate() + amount);
  return current.toISOString().slice(0, 10);
}

export const EntryModal: React.FC<EntryModalProps> = ({
  defaultDate,
  entityName,
  defaultEntityId,
  defaultEntityType,
  onClose,
  onSubmit,
}) => {
  const [entityId] = useState<string>(defaultEntityId);
  const [entityType] = useState<EntityType>(defaultEntityType);
  const [date, setDate] = useState(defaultDate);
  const [stockJournalier, setStockJournalier] = useState('');
  const [achat, setAchat] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stockValue = Number(stockJournalier);
  const achatValue = Number(achat);
  const valuesAreValid =
    stockJournalier.trim() !== '' &&
    achat.trim() !== '' &&
    Number.isFinite(stockValue) &&
    Number.isFinite(achatValue) &&
    stockValue >= 0 &&
    achatValue >= 0;

  useEffect(() => {
    let cancelled = false;

    const loadExisting = async () => {
      if (!entityId || !date) return;
      setLoadingExisting(true);
      setError(null);
      try {
        const existing = await apiService.getRecords(entityType, entityId, date.slice(0, 7));
        if (cancelled) return;
        const row = existing.find((record) => record.date === date);
        setStockJournalier(row?.stock_journalier === null || row?.stock_journalier === undefined ? '' : String(row.stock_journalier));
        setAchat(row ? String(row.achat ?? 0) : '');
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la saisie existante');
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    };

    loadExisting();
    return () => { cancelled = true; };
  }, [entityId, entityType, date]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!entityId) {
      setError('Aucune entité sélectionnée. Sélectionnez un partenaire, un DSM ou un POS avant la saisie.');
      return;
    }
    if (!date || !valuesAreValid || saving) {
      setError('Renseignez une date et deux valeurs numériques positives ou nulles.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({ entityId, entityType, date, stockJournalier: stockValue, achat: achatValue });
      onClose();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible d'enregistrer la saisie");
    } finally {
      setSaving(false);
    }
  };

  const changeDate = (amount: number) => {
    if (saving || !date) return;
    setDate((current) => shiftDate(current, amount));
    setStockJournalier('');
    setAchat('');
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-3"><img src="/logo-camtel.png" alt="CAMTEL" className="h-10 w-10 rounded-lg object-contain" /><h2 className="text-sm font-black text-slate-800">Saisie journalière</h2></div>
          <p className="mt-1 text-xs text-slate-500">
            L&apos;opérationnel renseigne le stock journalier et l&apos;achat du jour.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Entité concernée
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
              {entityName}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Date de référence
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeDate(-1)}
                disabled={saving || !date}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Jour précédent"
                title="Jour précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setError(null);
                }}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={() => changeDate(1)}
                disabled={saving || !date}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Jour suivant"
                title="Jour suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 font-medium">
              {loadingExisting ? 'Chargement des valeurs existantes...' : 'Dates passées ou futures autorisées'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Stock journalier (U)
              </label>
              <input
                type="number"
                min={0}
                step="any"
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
                step="any"
                value={achat}
                onChange={(event) => setAchat(event.target.value)}
                placeholder="ex: 640"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};
