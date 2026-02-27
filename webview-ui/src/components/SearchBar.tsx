import React from 'react';
import { SearchFilters } from '../../../src/models/ClipboardEntry';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onFilterChange }) => {
  return (
    <div className="search-bar">
      <input 
        type="text" 
        className="search-input" 
        placeholder="Search clipboard history..." 
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Additional filter UI could go here */}
    </div>
  );
};
