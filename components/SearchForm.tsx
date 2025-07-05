
import React from 'react';
import { SearchIcon, LoadingSpinnerIcon } from './icons';

interface SearchFormProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({ value, onChange, onSubmit, isLoading, placeholder }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-4 items-center">
      <div className="relative flex-grow">
        <input
          type="text"
          value={value}
          onChange={onChange}
          disabled={isLoading}
          placeholder={placeholder || "Enter search term..."}
          className="w-full pl-4 pr-10 py-3 bg-slate-800 border border-slate-600 rounded-md focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300 placeholder-slate-500 disabled:opacity-50"
          aria-label="GitHub Username Input"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-500 to-sky-600 text-white font-semibold rounded-md shadow-lg hover:from-teal-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-400 transition-transform transform hover:scale-105 active:scale-100 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:scale-100"
        aria-label="Analyze Profile"
      >
        {isLoading ? (
          <>
            <LoadingSpinnerIcon className="h-5 w-5" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <SearchIcon className="h-5 w-5 hidden sm:inline" />
            <span>Analyze</span>
          </>
        )}
      </button>
    </form>
  );
};
