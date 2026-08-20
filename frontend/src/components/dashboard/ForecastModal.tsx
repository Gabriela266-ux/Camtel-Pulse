import React, { useState, useEffect } from 'react';
import type { CentreHierarchy } from '../../types';

interface ForecastModalProps {
  isOpen: boolean;
  hierarchyData: CentreHierarchy;
  defaultPosId?: string;
  onClose: () => void;
  onSave: (posId: string, year: number, month: number, forecasts: Record<string, number>) => void;
  onLoadExisting?: (posId: string, year: number, month: number) => Promise<Record<string, number>>;
  isDark?: boolean;
}

function listPOS(data: CentreHierarchy) {
  const entities: { id: string; path: string }[] = [];
  for (const da of data.da) {
    for (const dsm of da.dsm) {
      for (const pos of dsm.pos) {
        entities.push({ id: pos.id, path: `${data.nom} / ${da.nom} / ${dsm.nom} / ${pos.nom}` });
      }
    }
  }
  return entities;
}

export const ForecastModal: React.FC<ForecastModalProps> = ({
  isOpen,
  hierarchyData,
  defaultPosId,
  onClose,
  onSave,
  onLoadExisting,
  isDark = false,
}) => {
  const posEntities = listPOS(hierarchyData);
  const [posId, setPosId] = useState<string>(defaultPosId ?? posEntities[0]?.id ?? '');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [forecasts, setForecasts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (defaultPosId) setPosId(defaultPosId);
  }, [defaultPosId]);

  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    // Calendrier d'achat réel déjà saisi pour ce POS/mois (table calendrier_achat côté backend),
    // pré-chargé pour ne pas écraser des valeurs existantes.
    const load = async () => {
      let existingByIso: Record<string, number> = {};
      if (onLoadExisting && posId) {
        try {
          existingByIso = await onLoadExisting(posId, selectedYear, selectedMonth);
        } catch (err) {
          console.error('Impossible de charger le calendrier existant :', err);
        }
      }

      const nextForecasts: Record<string, number> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const formattedDay = String(day).padStart(2, '0');
        const formattedMonth = String(selectedMonth).padStart(2, '0');
        const isoKey = `${selectedYear}-${formattedMonth}-${formattedDay}`;
        const dateKey = `${formattedDay}/${formattedMonth}/${selectedYear}`;
        nextForecasts[dateKey] = existingByIso[isoKey] ?? 0;
      }
      setForecasts(nextForecasts);
    };

    load();
  }, [selectedYear, selectedMonth, posId]);

  if (!isOpen) return null;

  const handleInputChange = (dateKey: string, value: string) => {
    const val = Number(value) || 0;
    setForecasts((prev) => ({ ...prev, [dateKey]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posId) return;
    onSave(posId, selectedYear, selectedMonth, forecasts);
    onClose();
  };

  const panelClass = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800';
  const fieldClass = isDark
    ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-violet-500'
    : 'border-slate-200 bg-white text-slate-800 focus:border-violet-500';
  const panelBorder = isDark ? 'border-slate-700' : 'border-slate-100';
  const sidebarClass = isDark ? 'bg-slate-800/80' : 'bg-slate-50/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className={`flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl shadow-xl ${panelClass}`}>
        <div className={`flex items-center justify-between border-b px-6 py-4 ${panelBorder}`}>
          <h2 className={`text-sm font-black uppercase tracking-wide ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            Calendrier d'achat mensuel
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`font-bold ${isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <div>
            <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Point de vente (POS)
            </label>
            <select
              value={posId}
              onChange={(e) => setPosId(e.target.value)}
              className={`w-full rounded-lg border p-2 text-xs font-bold focus:outline-none ${fieldClass}`}
            >
              {posEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.path}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Mois
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className={`w-full rounded-lg border p-2 text-xs font-bold focus:outline-none ${fieldClass}`}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`mb-1 block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Année
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={`w-full rounded-lg border p-2 text-xs font-bold focus:outline-none ${fieldClass}`}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className={`block text-xs font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              Saisie journalière ({Object.keys(forecasts).length} jours)
            </label>
            <div className={`max-h-60 space-y-2 overflow-y-auto rounded-xl border p-3 pr-1 ${panelBorder} ${sidebarClass}`}>
              {Object.keys(forecasts).map((dateKey) => (
                <div
                  key={dateKey}
                  className={`flex items-center justify-between gap-4 rounded-lg border p-2 shadow-sm ${
                    isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'
                  }`}
                >
                  <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {dateKey} :
                  </span>
                  <input
                    type="number"
                    value={forecasts[dateKey]}
                    onChange={(e) => handleInputChange(dateKey, e.target.value)}
                    className={`w-28 rounded-lg border px-3 py-1 text-right text-xs font-mono font-bold focus:outline-none ${fieldClass}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={`flex justify-end gap-2 border-t pt-4 ${panelBorder}`}>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg border px-4 py-2 text-xs font-bold ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
            >
              Enregistrer le calendrier d'achat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};