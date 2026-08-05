import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label>
        Identifiant (client / DSM / POS)&nbsp;
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: GLOTELHO-01"
        />
      </label>
      <button onClick={onSearch} style={{ marginLeft: '0.5rem' }}>
        Rechercher
      </button>
    </div>
  );
};

export default SearchBar;
