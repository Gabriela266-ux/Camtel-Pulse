import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch }) => {
  return (
    <section className="panel">
      <h2>Rechercher une entité</h2>
      <p className="panel-text">Consultez l’historique d’un client, DSM ou POS en un clic.</p>
      <div className="search-form">
        <div className="input-group">
          <label className="label-text" htmlFor="entity-search">Identifiant</label>
          <input
            id="entity-search"
            className="form-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ex: GLOTELHO-01"
          />
        </div>
        <button className="primary-btn" type="button" onClick={onSearch}>
          Rechercher
        </button>
      </div>
    </section>
  );
};

export default SearchBar;
