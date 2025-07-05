
import { GithubUser, GithubRepo, UserProfile } from '../types';

const GITHUB_API_URL = 'https://api.github.com';

export const getUserProfileData = async (username: string): Promise<UserProfile> => {
  try {
    const userResponsePromise = fetch(`${GITHUB_API_URL}/users/${username}`);
    // Get top 10 repos by stars to analyze their most impactful work
    const reposResponsePromise = fetch(`${GITHUB_API_URL}/users/${username}/repos?type=owner&sort=stars&per_page=10&direction=desc`);

    const [userResponse, reposResponse] = await Promise.all([userResponsePromise, reposResponsePromise]);

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        throw new Error(`GitHub user not found: ${username}.`);
      }
      throw new Error(`Failed to fetch user data. Status: ${userResponse.status}`);
    }
     if (!reposResponse.ok) {
      throw new Error(`Failed to fetch repository data. Status: ${reposResponse.status}`);
    }

    const userData: GithubUser = await userResponse.json();
    const repoData: GithubRepo[] = await reposResponse.json();

    return { user: userData, repos: repoData };

  } catch (error: any) {
    if (error.message.includes('API rate limit exceeded')) {
        throw new Error('GitHub API rate limit exceeded. Please wait and try again later.');
    }
    // Re-throw other errors to be caught by the caller
    throw error;
  }
};
