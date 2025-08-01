
import React, { useState, useCallback } from 'react';
import { UserProfile, AnimeBadge } from './types';
import { getUserProfileData } from './services/githubService';
import { getAnimeBadge, generateAvatar } from './services/geminiService';
import { SearchForm } from './components/SearchForm';
import { UserCard } from './components/UserCard';
import { BadgeDisplay } from './components/BadgeDisplay';
import { Loader } from './components/Loader';
import { ErrorAlert } from './components/ErrorAlert';
import { ShinobiScrollIcon } from './components/icons';

const App: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState<string>('torvalds');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [badgeInfo, setBadgeInfo] = useState<AnimeBadge | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!usernameInput) {
        setError('Please enter a GitHub username.');
        return;
    }
    setIsLoading(true);
    setIsGeneratingAvatar(false);
    setError(null);
    setUserProfile(null);
    setBadgeInfo(null);
    setAvatarUrl(null);

    try {
      const profileData = await getUserProfileData(usernameInput);
      setUserProfile(profileData);

      const badgeData = await getAnimeBadge(profileData);
      setBadgeInfo(badgeData);
      
      // Start generating the avatar after getting the badge info
      setIsGeneratingAvatar(true);
      const imageUrl = await generateAvatar(badgeData);
      setAvatarUrl(imageUrl);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsGeneratingAvatar(false);
    }
  }, [usernameInput]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-white font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <ShinobiScrollIcon className="h-12 w-12 text-teal-400" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-500">
              GitHub Profile-Jutsu
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Unveil the inner shinobi of a GitHub user. Enter a username to analyze their public work and assign them a unique, AI-generated character avatar.
          </p>
        </header>

        <main>
          <SearchForm
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onSubmit={handleSearch}
            isLoading={isLoading}
            placeholder="e.g., torvalds, gaearon"
          />

          {error && <ErrorAlert message={error} />}

          <div className="mt-8">
            {isLoading && <Loader />}

            {userProfile && badgeInfo && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <UserCard profile={userProfile} />
                <BadgeDisplay 
                    badge={badgeInfo} 
                    avatarUrl={avatarUrl}
                    isLoadingAvatar={isGeneratingAvatar}
                />
              </div>
            )}
            
            {!isLoading && !userProfile && !error && (
                 <div className="text-center py-16 px-4 bg-gray-800/50 rounded-lg border border-slate-700">
                    <p className="text-slate-400">Enter a GitHub username to begin the summoning ritual.</p>
                </div>
            )}
          </div>
        </main>
        
        <footer className="text-center mt-12 text-slate-500 text-sm">
            <p>Powered by the Gemini API and GitHub API. Character assignments and avatars are generated by AI.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
