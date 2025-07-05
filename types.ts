
export interface GithubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  topics: string[];
}

export interface UserProfile {
    user: GithubUser;
    repos: GithubRepo[];
}

export interface AnimeBadge {
  characterName: string;
  anime: 'Naruto' | 'Demon Slayer' | string;
  reason: string;
  badgeColor: string;
}
