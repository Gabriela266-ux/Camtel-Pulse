import React, { useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import DailyInputForm from './components/DailyInputForm';
import DailyTable from './components/DailyTable';
import { DailyEntry } from './types';

const STOCK_SECURITE_CLIENT = (objectifMensuel: number) =>
  (objectifMensuel / 31) * 3;

const App: React.FC = () => {
  const [searchId, setSearchId] = useState<string>('GLOTELHO');
  const [currentId, setCurrentId] = useState<string>('GLOTELHO');
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
    setCurrentId(searchId.trim());
    // plus tard : appel backend pour charger les données de cette entité
  };

  const handleNewSale = (venteJour: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const previous = entries.filter((e) => e.entityId === currentId);
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

    setEntries([...entries, newEntry]);
  };

  const filteredEntries = entries.filter((e) => e.entityId === currentId);

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Camtel-Pulse — Suivi des objectifs commerciaux</h1>

      <SearchBar
        value={searchId}
        onChange={setSearchId}
        onSearch={handleSearch}
      />

      <DailyInputForm entityId={currentId} onSubmit={handleNewSale} />

      <DailyTable entries={filteredEntries} />
    </div>
  );
};

export default App;
