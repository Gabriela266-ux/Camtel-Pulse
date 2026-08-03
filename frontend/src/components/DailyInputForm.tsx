import React, { useState } from 'react';

interface DailyInputFormProps {
  entityId: string;
  onSubmit: (venteJour: number) => void;
}

const DailyInputForm: React.FC<DailyInputFormProps> = ({ entityId, onSubmit }) => {
  const [venteJour, setVenteJour] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(venteJour);
    if (isNaN(value) || value < 0) return;
    onSubmit(value);
    setVenteJour('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <h3>Saisie journalière pour {entityId}</h3>
      <input
        type="number"
        value={venteJour}
        onChange={(e) => setVenteJour(e.target.value)}
        placeholder="Vente du jour"
      />
      <button type="submit" style={{ marginLeft: '0.5rem' }}>
        Enregistrer
      </button>
    </form>
  );
};

export default DailyInputForm;
