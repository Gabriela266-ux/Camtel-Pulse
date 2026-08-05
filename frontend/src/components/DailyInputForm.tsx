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
    <section className="panel">
      <h3>Saisie journalière</h3>
      <p className="panel-text">Enregistrez la vente du jour pour {entityId}.</p>
      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="label-text" htmlFor="daily-sale">Montant</label>
          <input
            id="daily-sale"
            className="form-input"
            type="number"
            min="0"
            value={venteJour}
            onChange={(e) => setVenteJour(e.target.value)}
            placeholder="Ex: 150000"
          />
        </div>
        <button className="primary-btn" type="submit">
          Enregistrer
        </button>
      </form>
    </section>
  );
};

export default DailyInputForm;
