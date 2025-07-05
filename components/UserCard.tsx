
import React from 'react';
import { UserProfile } from '../types';
import { StarIcon, CodeBracketIcon, LinkIcon } from './icons';

interface UserCardProps {
  profile: UserProfile;
}

export const UserCard: React.FC<UserCardProps> = ({ profile }) => {
  const { user, repos } = profile;

  // Aggregate languages from top repos
  const topLanguages = repos
    .map(repo => repo.language)
    .filter((lang): lang is string => lang !== null)
    .reduce((acc, lang) => {
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

  const sortedLanguages = Object.entries(topLanguages).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-slate-800/70 p-6 rounded-lg border border-slate-700 shadow-xl h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <img src={user.avatar_url} alt={user.login} className="h-20 w-20 rounded-full border-2 border-slate-600" />
        <div>
            <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xl font-bold text-teal-400 hover:text-teal-300 hover:underline transition-colors">
                {user.name || user.login}
                <LinkIcon className="w-4 h-4" />
            </a>
            <p className="text-sm text-slate-400">@{user.login}</p>
        </div>
      </div>
      
      <p className="text-slate-300 mb-4">{user.bio || "No bio provided."}</p>

      {sortedLanguages.length > 0 && (
        <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2 font-semibold">Top Languages</p>
            <div className="flex flex-wrap gap-2">
                {sortedLanguages.slice(0, 3).map(([lang]) => (
                    <span key={lang} className="inline-block bg-sky-500/20 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full">{lang}</span>
                ))}
            </div>
        </div>
      )}
      
      <div className="mt-auto pt-4 border-t border-slate-700 flex flex-col gap-3">
          <h4 className="text-sm text-slate-400 font-semibold">Analyzed Repositories ({repos.length} most starred)</h4>
          <ul className="space-y-2">
            {repos.slice(0, 3).map(repo => (
                <li key={repo.id} className="text-sm flex justify-between items-center bg-slate-900/50 p-2 rounded-md">
                   <div className="flex items-center gap-2">
                    <CodeBracketIcon className="w-4 h-4 text-slate-500" />
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-teal-300 truncate" title={repo.name}>{repo.name}</a>
                   </div>
                   <div className="flex items-center gap-1 text-yellow-400 shrink-0 ml-2">
                        <span className="text-xs">{repo.stargazers_count}</span>
                        <StarIcon className="w-3 h-3" />
                   </div>
                </li>
            ))}
          </ul>
      </div>
    </div>
  );
};
