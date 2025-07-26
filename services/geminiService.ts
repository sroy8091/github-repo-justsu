import { UserProfile, AnimeBadge } from '../types';

// Lazy environment variable getters to avoid module-level crashes
const getOpenRouterKey = (): string => {
    console.log("OPENROUTER_API_KEY", process.env);
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        throw new Error("OPENROUTER_API_KEY environment variable not set");
    }
    return key;
};

const getImageRouterKey = (): string => {
    const key = process.env.IMAGEROUTER_API_KEY;
    if (!key) {
        throw new Error("IMAGEROUTER_API_KEY environment variable not set");
    }
    return key;
};

// Configuration constants
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';
const IMAGEROUTER_MODEL = process.env.IMAGEROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
const REQUEST_TIMEOUT = 30000; // 30 seconds

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
  // Input validation
  if (!profileData?.user?.login || !Array.isArray(profileData.repos)) {
    throw new Error("Invalid profile data provided");
  }

  try {
    const prompt = generateUserPrompt(profileData);

    // Add timeout for request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const requestBody = {
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    };

    console.log('OpenRouter request:', { model: OPENROUTER_MODEL, bodyLength: JSON.stringify(requestBody).length });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${getOpenRouterKey()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/sumitroy/github-repo-jutsu',
        'X-Title': 'GitHub Repo Jutsu'
      },
      body: JSON.stringify(requestBody)
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error details:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from OpenRouter API");
    }

    let jsonStr = data.choices[0].message.content.trim();
    
    const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/;
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
      console.error("Error generating anime badge:", error.name || 'Unknown error');
      
      if (error.name === 'AbortError') {
          throw new Error("Request timed out. Please try again.");
      }
      if (error.message.includes("JSON.parse")) {
          throw new Error("The AI returned an invalid response. Please try again.");
      }
      if (error.message.includes("environment variable")) {
          throw error; // Re-throw configuration errors as-is
      }
      
      // Sanitize error message to avoid exposing sensitive information
      const sanitizedMessage = error.message?.replace(/Bearer [^\s]+/g, 'Bearer [REDACTED]') || 'Unknown error';
      throw new Error(`Failed to get anime badge from OpenRouter: ${sanitizedMessage}`);
  }
};

export const generateAvatar = async (badge: AnimeBadge): Promise<string> => {
    // Input validation
    if (!badge?.characterName || !badge?.anime || !badge?.badgeColor) {
        throw new Error("Invalid badge data provided");
    }

    try {
        const prompt = `Create a visually stunning, anime-style avatar for a GitHub profile picture. The character is ${badge.characterName} from ${badge.anime}. The avatar should be a circular headshot, vibrant, and capture their essence. The background should be simple and abstract, using thematic colors like ${badge.badgeColor}. The style should be modern anime, clean, and professional.`;

        // Add timeout for request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch('https://api.imagerouter.ai/v1/generate', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${getImageRouterKey()}`,
                'Content-Type': 'application/json',
                'User-Agent': 'GitHub-Repo-Jutsu/1.0'
            },
            body: JSON.stringify({
                prompt: prompt,
                model: IMAGEROUTER_MODEL,
                width: 512,
                height: 512,
                steps: 25,
                guidance: 3.5,
                output_format: 'jpeg',
                output_quality: 95
            })
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`ImageRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.image || !data.image.base64) {
            throw new Error("ImageRouter model did not return an image.");
        }

        return `data:image/jpeg;base64,${data.image.base64}`;

    } catch (error: any) {
        console.error("Error generating avatar image:", error.name || 'Unknown error');
        
        if (error.name === 'AbortError') {
            throw new Error("Image generation request timed out. Please try again.");
        }
        if (error.message.includes("environment variable")) {
            throw error; // Re-throw configuration errors as-is
        }
        
        // Sanitize error message to avoid exposing sensitive information
        const sanitizedMessage = error.message?.replace(/Bearer [^\s]+/g, 'Bearer [REDACTED]') || 'Unknown error';
        throw new Error(`Failed to generate the character avatar: ${sanitizedMessage}. Please try again.`);
    }
};
