import React, { useState, useEffect } from 'react';
import type { CalendarEntity, DAHierarchy, EntityType } from '../../types';

interface ForecastModalProps {
  isOpen: boolean;
  hierarchyData: DAHierarchy;
  defaultEntityType?: EntityType;
  defaultEntityId?: string;
  onClose: () => void;
  onSave: (entity: CalendarEntity, year: number, month: number, forecasts: Record<string, number>) => Promise<void> | void;
  onLoadExisting?: (entity: CalendarEntity, year: number, month: number) => Promise<Record<string, number>>;
  isDark?: boolean;
}

function listEntities(data: DAHierarchy, entityType?: EntityType, entityId?: string): CalendarEntity[] {
  const entities: CalendarEntity[] = [];
  for (const da of data.da) {
    if (entityType === 'DA' && da.id !== entityId) continue;
    if (!entityType || entityType === 'DA') entities.push({ type: 'DA', id: da.id, label: `Partenaire · ${da.nom}` });
    for (const dsm of da.dsm) {
      if (entityType === 'DSM' && dsm.id !== entityId) continue;
      if (entityType !== 'POS') entities.push({ type: 'DSM', id: dsm.id, label: `DSM · ${da.nom} / ${dsm.nom}` });
      for (const pos of dsm.pos) {
        if (entityType === 'POS' && pos.id !== entityId) continue;
        entities.push({ type: 'POS', id: pos.id, label: `POS · ${da.nom} / ${dsm.nom} / ${pos.nom}` });
      }
    }
  }
  return entities;
}

export const ForecastModal: React.FC<ForecastModalProps> = ({
  isOpen,
  hierarchyData,
  defaultEntityType,
  defaultEntityId,
  onClose,
  onSave,
  onLoadExisting,
  isDark = false,
}) => {
  const entities = listEntities(hierarchyData, defaultEntityType, defaultEntityId);
  const defaultKey = defaultEntityType && defaultEntityId ? `${defaultEntityType}:${defaultEntityId}` : '';
  const [entityKey, setEntityKey] = useState<string>(defaultKey || (entities[0] ? `${entities[0].type}:${entities[0].id}` : ''));
  const selectedEntity = entities.find((entity) => `${entity.type}:${entity.id}` === entityKey);
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [forecasts, setForecasts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEntityType && defaultEntityId) setEntityKey(`${defaultEntityType}:${defaultEntityId}`);
  }, [defaultEntityType, defaultEntityId]);

  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const load = async () => {
      let existingByIso: Record<string, number> = {};
      if (onLoadExisting && selectedEntity) {
        try {
          setError(null);
          existingByIso = await onLoadExisting(selectedEntity, selectedYear, selectedMonth);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Impossible de charger le calendrier existant');
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
  }, [selectedYear, selectedMonth, entityKey]);

  if (!isOpen) return null;

  const handleInputChange = (dateKey: string, value: string) => {
    const val = Number(value) || 0;
    setForecasts((prev) => ({ ...prev, [dateKey]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity || saving) return;

    setError(null);
    setSaving(true);
    Promise.resolve(onSave(selectedEntity, selectedYear, selectedMonth, forecasts))
      .then(() => onClose())
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Impossible d'enregistrer le calendrier d'achat");
      })
      .finally(() => setSaving(false));
  };

  const panelClass = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800';
  const fieldClass = isDark
    ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-sky-500'
    : 'border-slate-200 bg-white text-slate-800 focus:border-sky-500';
  const panelBorder = isDark ? 'border-slate-700' : 'border-slate-100';
  const sidebarClass = isDark ? 'bg-slate-800/80' : 'bg-slate-50/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className={`flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl shadow-xl ${panelClass}`}>
        <div className={`flex items-center justify-between border-b px-6 py-4 ${panelBorder}`}>
          <div className="flex items-center gap-3"><img src="/logo-camtel.png" alt="CAMTEL" className="h-10 w-10 rounded-lg object-contain" /><h2 className={`text-sm font-black uppercase tracking-wide ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Calendrier d'achat mensuel</h2></div>
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
              Entité
            </label>
            <div className={`w-full rounded-lg border p-2.5 text-xs font-bold ${fieldClass}`}>
              {selectedEntity?.label || 'Aucune entité sélectionnée'}
            </div>
            {selectedEntity && <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Portée : {selectedEntity.type === 'DA' ? 'Partenaire' : selectedEntity.type}</p>}
            {entities.length === 0 && (
              <p className="mt-1 text-xs font-medium text-rose-600">
                Aucune entité disponible pour ce calendrier.
              </p>
            )}
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
            {error && (
              <p className="mr-auto max-w-xs self-center text-xs font-medium text-rose-600">{error}</p>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`rounded-lg border px-4 py-2 text-xs font-bold ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedEntity || entities.length === 0 || saving}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : "Enregistrer le calendrier d'achat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
