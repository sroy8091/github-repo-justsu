import React from 'react';
import { AnimeBadge } from '../types';
import { DownloadIcon, UserCircleIcon, LoadingSpinnerIcon } from './icons';

interface BadgeDisplayProps {
  badge: AnimeBadge;
  avatarUrl: string | null;
  isLoadingAvatar: boolean;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge, avatarUrl, isLoadingAvatar }) => {
  const { characterName, anime, reason, badgeColor } = badge;
  
  return (
    <div
      className="rounded-lg shadow-xl h-full flex flex-col overflow-hidden border"
      style={{ 
        backgroundColor: `${badgeColor}20`,
        borderColor: badgeColor 
      }}
    >
        <div className="relative aspect-square bg-gray-800 flex items-center justify-center">
            {isLoadingAvatar && (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                    <LoadingSpinnerIcon className="w-10 h-10" style={{ color: badgeColor }}/>
                    <p>Generating Avatar...</p>
                </div>
            )}
            {avatarUrl && (
                <img 
                    src={avatarUrl}
                    alt={`AI-generated avatar of ${characterName}`} 
                    className="w-3/4 h-3/4 object-contain animate-fade-in mx-auto my-auto"
                />
            )}
            <div 
              className="absolute inset-0"
              style={{ background: `linear-gradient(to top, ${badgeColor}99, transparent)` }}
            ></div>
            <div className="absolute bottom-0 left-0 p-4">
                 <span className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">{anime}</span>
            </div>
        </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold" style={{ color: badgeColor }}>{characterName}</h3>
        <p className="mt-2 text-slate-200 flex-grow">
            <span className="font-semibold text-slate-400">Reasoning:</span> "{reason}"
        </p>
        
        <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-3" style={{ borderColor: `${badgeColor}50` }}>
            <a
              href={avatarUrl || undefined}
              download={avatarUrl ? `${characterName}-avatar.jpg` : undefined}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white font-semibold rounded-md shadow-lg transition-all transform hover:scale-105 active:scale-100 ${
                !avatarUrl
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r hover:from-teal-600 hover:to-sky-700'
              }`}
              style={avatarUrl ? { 
                '--tw-gradient-from': `${badgeColor}dd`, 
                '--tw-gradient-to': `${badgeColor}88`,
                '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)'
              } as React.CSSProperties : {}}
              aria-disabled={!avatarUrl}
            >
              <DownloadIcon className="w-5 h-5" />
              Download Avatar
            </a>
            <a
              href="https://github.com/settings/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-md shadow-lg transition-colors"
            >
                <UserCircleIcon className="w-5 h-5"/>
                Set on GitHub
            </a>
        </div>
      </div>
    </div>
  );
};
