
import React from 'react';
import { LoadingSpinnerIcon } from './icons';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
      <LoadingSpinnerIcon className="w-12 h-12 text-teal-400" />
      <p className="text-lg">Summoning shinobi to analyze the scrolls...</p>
    </div>
  );
};
