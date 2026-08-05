import React, { useMemo, useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import DailyInputForm from './components/DailyInputForm';
import DailyTable from './components/DailyTable';
import type { DailyEntry } from './types';

const STOCK_SECURITE_CLIENT = (objectifMensuel: number) =>
  (objectifMensuel / 31) * 3;

const App: React.FC = () => {
  const [searchId, setSearchId] = useState<string>('GLOTELHO');
  const [currentId, setCurrentId] = useState<string>('GLOTELHO');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<DailyEntry[]>([
    {
      date: '2026-08-01',
      entityId: 'GLOTELHO',
      entityName: 'Glotelho',
      level: 'client',
      venteJour: 80000,
      achatsCumulés: 80000,
      stockSécurité: 300000,
      écartJour: 80000 - 300000,
      écartCumulé: 80000 - 300000,
    },
    {
      date: '2026-08-02',
      entityId: 'GLOTELHO',
      entityName: 'Glotelho',
      level: 'client',
      venteJour: 150000,
      achatsCumulés: 230000,
      stockSécurité: 300000,
      écartJour: 150000 - 300000,
      écartCumulé: 230000 - 300000,
    },
  ]);

  const objectifMensuelClient = 3_100_000;
  const stockSécurité = STOCK_SECURITE_CLIENT(objectifMensuelClient);

  const handleSearch = () => {
    const nextId = searchId.trim() || 'GLOTELHO';
    setCurrentId(nextId);
  };

  const handleNewSale = (venteJour: number) => {
    const today = new Date().toISOString().slice(0, 10);

    setEntries((prevEntries) => {
      const previous = prevEntries.filter((entry) => entry.entityId === currentId);
      const lastCumul = previous.length
        ? previous[previous.length - 1].achatsCumulés
        : 0;

      const achatsCumulés = lastCumul + venteJour;
      const écartJour = venteJour - stockSécurité;
      const écartCumulé = achatsCumulés - stockSécurité;

      const newEntry: DailyEntry = {
        date: today,
        entityId: currentId,
        entityName: currentId,
        level: 'client',
        venteJour,
        achatsCumulés,
        stockSécurité,
        écartJour,
        écartCumulé,
      };

      return [...prevEntries, newEntry];
    });
  };

  const filteredEntries = useMemo(
    () => entries.filter((entry) => entry.entityId === currentId),
    [entries, currentId],
  );

  const lastEntry = filteredEntries[filteredEntries.length - 1];
  const selectedEntry = filteredEntries.find((entry) => entry.date === selectedDate);
  const activeEntry = selectedEntry ?? lastEntry;
  const progression = activeEntry
    ? Math.min(100, Math.round((activeEntry.achatsCumulés / objectifMensuelClient) * 100))
    : 0;
  const statut = activeEntry && activeEntry.écartCumulé >= 0 ? 'En progression' : 'À surveiller';

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Tableau de bord commercial</p>
          <h1>Camtel Pulse</h1>
          <p className="hero-text">
            Suivi quotidien des ventes, du stock de sécurité et des écarts de performance.
          </p>
        </div>
        <div className="hero-actions">
          <div className="hero-badge">{currentId}</div>
          <div className="date-block">
            <label className="date-label" htmlFor="dashboard-date">Date de référence</label>
            <input
              id="dashboard-date"
              className="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </header>

      <section className="summary-grid">
        <article className="summary-card primary">
          <span className="summary-label">Objectif mensuel</span>
          <strong className="summary-value">{objectifMensuelClient.toLocaleString('fr-FR')} FCFA</strong>
          <span className="summary-meta">Progression de {progression}%</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Dernière vente</span>
          <strong className="summary-value">
            {activeEntry ? `${activeEntry.venteJour.toLocaleString('fr-FR')} FCFA` : 'Aucune donnée'}
          </strong>
          <span className="summary-meta">
            {activeEntry ? `Le ${activeEntry.date}` : 'À renseigner'}
          </span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Stock de sécurité</span>
          <strong className="summary-value">{stockSécurité.toLocaleString('fr-FR')} FCFA</strong>
          <span className="summary-meta">Seuil de référence journalier</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Écart journalier</span>
          <strong className={`summary-value ${activeEntry?.écartJour >= 0 ? 'positive' : 'negative'}`}>
            {activeEntry ? `${activeEntry.écartJour.toLocaleString('fr-FR')} FCFA` : '—'}
          </strong>
          <span className="summary-meta">
            {activeEntry
              ? activeEntry.écartJour >= 0
                ? 'Tendance positive'
                : 'Tendance négative'
              : 'Pas de données'}
          </span>
        </article>
        <article className="summary-card">
          <span className="summary-label">État</span>
          <strong className="summary-value">{statut}</strong>
          <span className="summary-meta">Écart cumulé : {activeEntry ? `${activeEntry.écartCumulé.toLocaleString('fr-FR')} FCFA` : '—'}</span>
        </article>
      </section>

      <section className="controls-grid">
        <SearchBar value={searchId} onChange={setSearchId} onSearch={handleSearch} />
        <DailyInputForm entityId={currentId} onSubmit={handleNewSale} />
      </section>

      <DailyTable entries={filteredEntries} selectedDate={selectedDate} />
    </div>
  );
};

export default App;
