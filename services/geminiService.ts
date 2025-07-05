
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, AnimeBadge } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateUserPrompt = (profile: UserProfile): string => {
  // Summarize repos to keep the prompt focused and efficient
  const repoSummary = profile.repos.map(repo => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    topics: repo.topics?.slice(0, 3) || []
  }));

  const userSummary = {
      name: profile.user.name,
      login: profile.user.login,
      bio: profile.user.bio,
      top_repos: repoSummary
  }
  
  return `
    You are an expert GitHub profile analyst with a deep love for anime, specifically Naruto and Demon Slayer. Your task is to analyze the provided GitHub user's profile and their top repositories to assign them a character from either Naruto or Demon Slayer that best represents their coding style, impact, and overall persona.

    Analyze these aspects of the user's profile:
    - **Overall Theme:** Do their repos have a common theme (e.g., building foundational tools, creating beautiful UIs, data science, system-level programming)?
    - **Primary Languages:** What do their most-used languages say about them (e.g., Rust for safety, Python for versatility, C for performance)?
    - **Impact (Stars/Forks):** Is this user highly influential like a Kage or a Hashira, creating projects that many others rely on? Or are they a specialist with niche but powerful skills?
    - **Bio/Persona:** Does their bio give any clues to their personality?

    Based on your holistic analysis, choose a single character. Be creative and insightful.

    **User Profile Data:**
    \`\`\`json
    ${JSON.stringify(userSummary, null, 2)}
    \`\`\`

    **Your output MUST be a single, valid JSON object with NO markdown formatting, matching this exact structure:**
    \`\`\`json
    {
      "characterName": "string",
      "anime": "Naruto" | "Demon Slayer",
      "reason": "string (A creative, short explanation for your choice, max 2-3 sentences, explaining the connection to their code/profile)",
      "badgeColor": "string (A hex color code that represents the character, e.g., '#FF7F00' for Naruto, '#107C80' for Tanjiro)"
    }
    \`\`\`
  `;
};

export const getAnimeBadge = async (profileData: UserProfile): Promise<AnimeBadge> => {
  try {
    const prompt = generateUserPrompt(profileData);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.8,
        },
    });

    let jsonStr = response.text.trim();
    
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
        jsonStr = match[1].trim();
    }

    const parsedData: AnimeBadge = JSON.parse(jsonStr);
    
    if (!parsedData.characterName || !parsedData.anime || !parsedData.reason || !parsedData.badgeColor) {
        throw new Error("AI response is missing required fields.");
    }

    return parsedData;

  } catch (error: any) {
      console.error("Error generating anime badge:", error);
      if (error.message.includes("JSON.parse")) {
          throw new Error("The AI returned an invalid response. Please try again.");
      }
      throw new Error(`Failed to get anime badge from Gemini: ${error.message}`);
  }
};

export const generateAvatar = async (badge: AnimeBadge): Promise<string> => {
    try {
        const prompt = `Create a visually stunning, anime-style avatar for a GitHub profile picture. The character is ${badge.characterName} from ${badge.anime}. The avatar should be a circular headshot, vibrant, and capture their essence. The background should be simple and abstract, using thematic colors like ${badge.badgeColor}. The style should be modern anime, clean, and professional.`;

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });
        
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("Imagen model did not return an image.");
        }

        return `data:image/jpeg;base64,${base64ImageBytes}`;

    } catch (error: any) {
        console.error("Error generating avatar image:", error);
        // Provide a more specific error message for image generation failure
        throw new Error(`Failed to generate the character avatar. The AI may be busy or the request could not be processed. Please try again.`);
    }
};
