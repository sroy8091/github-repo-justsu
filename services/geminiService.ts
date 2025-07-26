import { UserProfile, AnimeBadge } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy environment variable getters to avoid module-level crashes
const getGeminiKey = (): string => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY environment variable not set");
    }
    return key;
};

// Configuration constants
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const REQUEST_TIMEOUT = 30000; // 30 seconds

const generateUserPrompt = (profile: UserProfile): string => {
  // Optimize: Only take top 3 repos and minimal data to reduce tokens
  const topRepos = profile.repos.slice(0, 3).map(repo => ({
    name: repo.name,
    lang: repo.language,
    stars: repo.stargazers_count
  }));

  const user = {
    name: profile.user.name || profile.user.login,
    bio: profile.user.bio?.slice(0, 100) || '',
    repos: topRepos
  };

  return `Analyze this GitHub user and assign them a Naruto or Demon Slayer character:

User: ${JSON.stringify(user)}

Consider:
- Coding style from languages/repos
- Impact from stars
- Bio personality

Return JSON:
{
  "characterName": "string",
  "anime": "Naruto" | "Demon Slayer",
  "reason": "string (2 sentences max)",
  "badgeColor": "string (hex color)"
}`;
};

export const getAnimeBadge = async (profileData: UserProfile): Promise<AnimeBadge> => {
  // Input validation
  if (!profileData?.user?.login || !Array.isArray(profileData.repos)) {
    throw new Error("Invalid profile data provided");
  }

  try {
    const prompt = generateUserPrompt(profileData);

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(getGeminiKey());
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 300,
        responseMimeType: "application/json"
      }
    });

    console.log('Gemini request:', { model: GEMINI_MODEL, promptLength: prompt.length });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text().trim();

    const parsedData: AnimeBadge = JSON.parse(jsonStr);
    
    if (!parsedData.characterName || !parsedData.anime || !parsedData.reason || !parsedData.badgeColor) {
        throw new Error("AI response is missing required fields.");
    }

    return parsedData;

  } catch (error: any) {
      console.error("Error generating anime badge:", error.name || 'Unknown error');
      
      if (error.message.includes("JSON.parse")) {
          throw new Error("The AI returned an invalid response. Please try again.");
      }
      if (error.message.includes("environment variable")) {
          throw error; // Re-throw configuration errors as-is
      }
      
      // Sanitize error message to avoid exposing sensitive information
      const sanitizedMessage = error.message?.replace(/Bearer [^\s]+/g, 'Bearer [REDACTED]') || 'Unknown error';
      throw new Error(`Failed to get anime badge from Gemini: ${sanitizedMessage}`);
  }
};

// Character image mapping for popular characters
const characterImages: Record<string, string> = {
  'Naruto': 'https://cdn.myanimelist.net/images/characters/2/284121.jpg',
  'Sasuke': 'https://cdn.myanimelist.net/images/characters/9/131317.jpg',
  'Kakashi': 'https://cdn.myanimelist.net/images/characters/7/284129.jpg',
  'Sakura': 'https://cdn.myanimelist.net/images/characters/9/69275.jpg',
  'Itachi': 'https://cdn.myanimelist.net/images/characters/9/284167.jpg',
  'Gaara': 'https://cdn.myanimelist.net/images/characters/8/284139.jpg',
  'Rock Lee': 'https://cdn.myanimelist.net/images/characters/11/253723.jpg',
  'Neji': 'https://cdn.myanimelist.net/images/characters/2/284133.jpg',
  'Shikamaru': 'https://cdn.myanimelist.net/images/characters/3/284135.jpg',
  'Hinata': 'https://cdn.myanimelist.net/images/characters/5/284137.jpg',
  'Tanjiro': 'https://cdn.myanimelist.net/images/characters/15/271763.jpg',
  'Nezuko': 'https://cdn.myanimelist.net/images/characters/3/271765.jpg',
  'Zenitsu': 'https://cdn.myanimelist.net/images/characters/7/271767.jpg',
  'Inosuke': 'https://cdn.myanimelist.net/images/characters/9/271769.jpg',
  'Giyu': 'https://cdn.myanimelist.net/images/characters/11/271771.jpg',
  'Rengoku': 'https://cdn.myanimelist.net/images/characters/13/271773.jpg',
  'Shinobu': 'https://cdn.myanimelist.net/images/characters/5/271775.jpg',
  'Mitsuri': 'https://cdn.myanimelist.net/images/characters/7/271777.jpg',
  'Obanai': 'https://cdn.myanimelist.net/images/characters/9/271779.jpg',
  'Tengen': 'https://cdn.myanimelist.net/images/characters/11/271781.jpg'
};

export const generateAvatar = async (badge: AnimeBadge): Promise<string> => {
    // Input validation
    if (!badge?.characterName || !badge?.anime) {
        throw new Error("Invalid badge data provided");
    }

    try {
        // First try to use pre-mapped character image
        const characterImage = characterImages[badge.characterName];
        if (characterImage) {
            return characterImage;
        }

        // Fallback: Search Jikan API for character
        const searchQuery = encodeURIComponent(`${badge.characterName} ${badge.anime}`);
        const response = await fetch(`https://api.jikan.moe/v4/characters?q=${searchQuery}&limit=1`, {
            method: 'GET',
            headers: {
                'User-Agent': 'GitHub-Repo-Jutsu/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.data && data.data.length > 0 && data.data[0].images?.jpg?.image_url) {
            return data.data[0].images.jpg.image_url;
        }

        // Ultimate fallback: generic anime avatar based on anime
        const fallbackImages = {
            'Naruto': 'https://cdn.myanimelist.net/images/characters/2/284121.jpg',
            'Demon Slayer': 'https://cdn.myanimelist.net/images/characters/15/271763.jpg'
        };
        
        return fallbackImages[badge.anime as keyof typeof fallbackImages] || fallbackImages['Naruto'];

    } catch (error: any) {
        console.error("Error getting character avatar:", error.message);
        
        // Return a default anime avatar if all else fails
        return 'https://cdn.myanimelist.net/images/characters/2/284121.jpg';
    }
};
