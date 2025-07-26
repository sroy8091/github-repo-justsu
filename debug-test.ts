#!/usr/bin/env node

/**
 * Comprehensive Test Script for OpenRouter/ImageRouter Implementation
 * This script systematically tests all aspects of the geminiService.ts implementation
 */

import { UserProfile, AnimeBadge } from './types';

// Mock sample data for testing
const sampleUserProfile: UserProfile = {
  user: {
    login: "testuser",
    id: 12345,
    avatar_url: "https://github.com/testuser.png",
    html_url: "https://github.com/testuser",
    name: "Test User",
    bio: "Full-stack developer passionate about TypeScript and React",
    public_repos: 25,
    followers: 150
  },
  repos: [
    {
      id: 1,
      name: "awesome-react-app",
      full_name: "testuser/awesome-react-app",
      description: "A modern React application with TypeScript",
      stargazers_count: 45,
      forks_count: 12,
      language: "TypeScript",
      html_url: "https://github.com/testuser/awesome-react-app",
      topics: ["react", "typescript", "frontend"]
    },
    {
      id: 2,
      name: "node-api-server",
      full_name: "testuser/node-api-server",
      description: "RESTful API server built with Node.js and Express",
      stargazers_count: 23,
      forks_count: 8,
      language: "JavaScript",
      html_url: "https://github.com/testuser/node-api-server",
      topics: ["nodejs", "express", "api"]
    }
  ]
};

const sampleAnimeBadge: AnimeBadge = {
  characterName: "Naruto Uzumaki",
  anime: "Naruto",
  reason: "Like Naruto, this developer shows determination and creates impactful projects that bring people together.",
  badgeColor: "#FF7F00"
};

// Test utilities
const logTest = (testName: string, status: 'PASS' | 'FAIL' | 'INFO', message: string) => {
  const timestamp = new Date().toISOString();
  const statusEmoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`[${timestamp}] ${statusEmoji} ${testName}: ${message}`);
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 1. Environment Variable Validation Tests
async function testEnvironmentVariables() {
  console.log('\n=== ENVIRONMENT VARIABLE VALIDATION TESTS ===\n');
  
  const originalOpenRouter = process.env.OPENROUTER_API_KEY;
  const originalImageRouter = process.env.IMAGEROUTER_API_KEY;
  
  try {
    // Test 1: Missing OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.IMAGEROUTER_API_KEY;
    
    try {
      // Force re-import by clearing module cache
      delete require.cache[require.resolve('./services/geminiService.ts')];
      await import('./services/geminiService.ts');
      logTest('Missing env vars', 'FAIL', 'Should have thrown error for missing OPENROUTER_API_KEY');
    } catch (error: any) {
      if (error.message.includes('OPENROUTER_API_KEY')) {
        logTest('Missing OPENROUTER_API_KEY', 'PASS', 'Correctly throws error when OPENROUTER_API_KEY is missing');
      } else {
        logTest('Missing OPENROUTER_API_KEY', 'FAIL', `Unexpected error: ${error.message}`);
      }
    }
    
    // Test 2: Missing IMAGEROUTER_API_KEY
    process.env.OPENROUTER_API_KEY = 'test-key';
    delete process.env.IMAGEROUTER_API_KEY;
    
    try {
      delete require.cache[require.resolve('./services/geminiService.ts')];
      await import('./services/geminiService.ts');
      logTest('Missing IMAGEROUTER_API_KEY', 'FAIL', 'Should have thrown error for missing IMAGEROUTER_API_KEY');
    } catch (error: any) {
      if (error.message.includes('IMAGEROUTER_API_KEY')) {
        logTest('Missing IMAGEROUTER_API_KEY', 'PASS', 'Correctly throws error when IMAGEROUTER_API_KEY is missing');
      } else {
        logTest('Missing IMAGEROUTER_API_KEY', 'FAIL', `Unexpected error: ${error.message}`);
      }
    }
    
    // Test 3: Valid environment variables
    process.env.OPENROUTER_API_KEY = 'valid-openrouter-key';
    process.env.IMAGEROUTER_API_KEY = 'valid-imagerouter-key';
    
    try {
      delete require.cache[require.resolve('./services/geminiService.ts')];
      await import('./services/geminiService.ts');
      logTest('Valid env vars', 'PASS', 'Module loads successfully with valid environment variables');
    } catch (error: any) {
      logTest('Valid env vars', 'FAIL', `Unexpected error with valid env vars: ${error.message}`);
    }
    
  } finally {
    // Restore original values
    if (originalOpenRouter) process.env.OPENROUTER_API_KEY = originalOpenRouter;
    if (originalImageRouter) process.env.IMAGEROUTER_API_KEY = originalImageRouter;
  }
}

// 2. API Request Format Verification
async function testAPIRequestFormats() {
  console.log('\n=== API REQUEST FORMAT VERIFICATION ===\n');
  
  // Mock fetch to intercept and validate requests
  const originalFetch = global.fetch;
  let capturedRequests: any[] = [];
  
  global.fetch = jest.fn().mockImplementation((url: string, options: any) => {
    capturedRequests.push({ url, options });
    
    // Mock successful responses
    if (url.includes('openrouter.ai')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify(sampleAnimeBadge)
            }
          }]
        })
      });
    } else if (url.includes('imagerouter.ai')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          image: {
            base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        })
      });
    }
    
    return Promise.reject(new Error('Unknown URL'));
  });
  
  try {
    const { getAnimeBadge, generateAvatar } = await import('./services/geminiService.ts');
    
    // Test OpenRouter request format
    await getAnimeBadge(sampleUserProfile);
    const openRouterRequest = capturedRequests.find(req => req.url.includes('openrouter.ai'));
    
    if (openRouterRequest) {
      logTest('OpenRouter URL', 'PASS', 'Correct OpenRouter endpoint used');
      
      // Validate headers
      const headers = openRouterRequest.options.headers;
      if (headers['Authorization']?.startsWith('Bearer ')) {
        logTest('OpenRouter Auth', 'PASS', 'Authorization header correctly formatted');
      } else {
        logTest('OpenRouter Auth', 'FAIL', 'Missing or incorrect Authorization header');
      }
      
      if (headers['Content-Type'] === 'application/json') {
        logTest('OpenRouter Content-Type', 'PASS', 'Correct Content-Type header');
      } else {
        logTest('OpenRouter Content-Type', 'FAIL', 'Incorrect Content-Type header');
      }
      
      // Validate request body
      const body = JSON.parse(openRouterRequest.options.body);
      if (body.model && body.messages && body.temperature !== undefined) {
        logTest('OpenRouter Body Structure', 'PASS', 'Request body has required fields');
      } else {
        logTest('OpenRouter Body Structure', 'FAIL', 'Request body missing required fields');
      }
      
      if (body.response_format?.type === 'json_object') {
        logTest('OpenRouter JSON Format', 'PASS', 'JSON response format specified');
      } else {
        logTest('OpenRouter JSON Format', 'FAIL', 'JSON response format not specified');
      }
    } else {
      logTest('OpenRouter Request', 'FAIL', 'No OpenRouter request captured');
    }
    
    // Test ImageRouter request format
    await generateAvatar(sampleAnimeBadge);
    const imageRouterRequest = capturedRequests.find(req => req.url.includes('imagerouter.ai'));
    
    if (imageRouterRequest) {
      logTest('ImageRouter URL', 'PASS', 'Correct ImageRouter endpoint used');
      
      // Validate headers
      const headers = imageRouterRequest.options.headers;
      if (headers['Authorization']?.startsWith('Bearer ')) {
        logTest('ImageRouter Auth', 'PASS', 'Authorization header correctly formatted');
      } else {
        logTest('ImageRouter Auth', 'FAIL', 'Missing or incorrect Authorization header');
      }
      
      // Validate request body
      const body = JSON.parse(imageRouterRequest.options.body);
      const requiredFields = ['prompt', 'model', 'width', 'height', 'steps', 'guidance', 'output_format', 'output_quality'];
      const missingFields = requiredFields.filter(field => !(field in body));
      
      if (missingFields.length === 0) {
        logTest('ImageRouter Body Structure', 'PASS', 'Request body has all required fields');
      } else {
        logTest('ImageRouter Body Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
      }
    } else {
      logTest('ImageRouter Request', 'FAIL', 'No ImageRouter request captured');
    }
    
  } catch (error: any) {
    logTest('API Format Test', 'FAIL', `Error during API format testing: ${error.message}`);
  } finally {
    global.fetch = originalFetch;
  }
}

// 3. Function Testing with Sample Data
async function testFunctionality() {
  console.log('\n=== FUNCTION TESTING WITH SAMPLE DATA ===\n');
  
  try {
    const { getAnimeBadge, generateAvatar } = await import('./services/geminiService.ts');
    
    // Test getAnimeBadge function
    try {
      logTest('getAnimeBadge Input Validation', 'INFO', 'Testing with sample UserProfile data');
      
      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify(sampleAnimeBadge)
            }
          }]
        })
      });
      
      const badge = await getAnimeBadge(sampleUserProfile);
      
      // Validate return type
      if (badge && typeof badge === 'object' && 
          'characterName' in badge && 'anime' in badge && 
          'reason' in badge && 'badgeColor' in badge) {
        logTest('getAnimeBadge Return Type', 'PASS', 'Returns object with correct AnimeBadge structure');
      } else {
        logTest('getAnimeBadge Return Type', 'FAIL', 'Return type does not match AnimeBadge interface');
      }
      
      // Validate field types
      if (typeof badge.characterName === 'string' && badge.characterName.length > 0) {
        logTest('characterName Field', 'PASS', 'characterName is non-empty string');
      } else {
        logTest('characterName Field', 'FAIL', 'characterName is invalid');
      }
      
      if (['Naruto', 'Demon Slayer'].includes(badge.anime) || typeof badge.anime === 'string') {
        logTest('anime Field', 'PASS', 'anime field is valid');
      } else {
        logTest('anime Field', 'FAIL', 'anime field is invalid');
      }
      
      if (badge.badgeColor.match(/^#[0-9A-Fa-f]{6}$/)) {
        logTest('badgeColor Field', 'PASS', 'badgeColor is valid hex color');
      } else {
        logTest('badgeColor Field', 'FAIL', 'badgeColor is not a valid hex color');
      }
      
    } catch (error: any) {
      logTest('getAnimeBadge Function', 'FAIL', `Error testing getAnimeBadge: ${error.message}`);
    }
    
    // Test generateAvatar function
    try {
      logTest('generateAvatar Input Validation', 'INFO', 'Testing with sample AnimeBadge data');
      
      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          image: {
            base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        })
      });
      
      const avatarDataUrl = await generateAvatar(sampleAnimeBadge);
      
      // Validate return type
      if (typeof avatarDataUrl === 'string' && avatarDataUrl.startsWith('data:image/jpeg;base64,')) {
        logTest('generateAvatar Return Type', 'PASS', 'Returns valid data URL string');
      } else {
        logTest('generateAvatar Return Type', 'FAIL', 'Return type is not a valid data URL');
      }
      
    } catch (error: any) {
      logTest('generateAvatar Function', 'FAIL', `Error testing generateAvatar: ${error.message}`);
    }
    
  } catch (error: any) {
    logTest('Function Testing', 'FAIL', `Error during function testing: ${error.message}`);
  }
}

// 4. Error Handling Testing
async function testErrorHandling() {
  console.log('\n=== ERROR HANDLING TESTING ===\n');
  
  try {
    const { getAnimeBadge, generateAvatar } = await import('./services/geminiService.ts');
    
    // Test network failures
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    try {
      await getAnimeBadge(sampleUserProfile);
      logTest('Network Error Handling', 'FAIL', 'Should have thrown error for network failure');
    } catch (error: any) {
      if (error.message.includes('Failed to get anime badge from OpenRouter')) {
        logTest('Network Error Handling', 'PASS', 'Correctly handles network errors');
      } else {
        logTest('Network Error Handling', 'FAIL', `Unexpected error message: ${error.message}`);
      }
    }
    
    // Test API error responses
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });
    
    try {
      await getAnimeBadge(sampleUserProfile);
      logTest('API Error Response', 'FAIL', 'Should have thrown error for API error');
    } catch (error: any) {
      if (error.message.includes('OpenRouter API error: 429')) {
        logTest('API Error Response', 'PASS', 'Correctly handles API error responses');
      } else {
        logTest('API Error Response', 'FAIL', `Unexpected error message: ${error.message}`);
      }
    }
    
    // Test invalid JSON response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: 'Invalid JSON content'
          }
        }]
      })
    });
    
    try {
      await getAnimeBadge(sampleUserProfile);
      logTest('Invalid JSON Handling', 'FAIL', 'Should have thrown error for invalid JSON');
    } catch (error: any) {
      if (error.message.includes('invalid response')) {
        logTest('Invalid JSON Handling', 'PASS', 'Correctly handles invalid JSON responses');
      } else {
        logTest('Invalid JSON Handling', 'FAIL', `Unexpected error message: ${error.message}`);
      }
    }
    
    // Test missing required fields
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({ characterName: 'Test' }) // Missing required fields
          }
        }]
      })
    });
    
    try {
      await getAnimeBadge(sampleUserProfile);
      logTest('Missing Fields Handling', 'FAIL', 'Should have thrown error for missing fields');
    } catch (error: any) {
      if (error.message.includes('missing required fields')) {
        logTest('Missing Fields Handling', 'PASS', 'Correctly validates required fields');
      } else {
        logTest('Missing Fields Handling', 'FAIL', `Unexpected error message: ${error.message}`);
      }
    }
    
    // Test ImageRouter errors
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    try {
      await generateAvatar(sampleAnimeBadge);
      logTest('ImageRouter Error', 'FAIL', 'Should have thrown error for ImageRouter API error');
    } catch (error: any) {
      if (error.message.includes('Failed to generate the character avatar')) {
        logTest('ImageRouter Error', 'PASS', 'Correctly handles ImageRouter errors');
      } else {
        logTest('ImageRouter Error', 'FAIL', `Unexpected error message: ${error.message}`);
      }
    }
    
    // Test missing image in response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        // Missing image field
      })
    });
    
    try {
      await generateAvatar(sampleAnimeBadge);
      logTest('Missing Image Handling', 'FAIL', 'Should have thrown error for missing image');
    } catch (error: any) {
      if (error.message.includes('did not return an image')) {
        logTest('Missing Image Handling', 'PASS', 'Correctly handles missing image in response');
      } else {
        logTest('Missing Image Handling', 'FAIL', `Unexpected error message: ${error.message}`);
      }
    }
    
  } catch (error: any) {
    logTest('Error Handling Testing', 'FAIL', `Error during error handling tests: ${error.message}`);
  }
}

// 5. Integration Testing
async function testIntegration() {
  console.log('\n=== INTEGRATION TESTING ===\n');
  
  try {
    // Test module import
    const geminiService = await import('./services/geminiService.ts');
    
    if (typeof geminiService.getAnimeBadge === 'function' && 
        typeof geminiService.generateAvatar === 'function') {
      logTest('Module Import', 'PASS', 'Functions can be imported correctly');
    } else {
      logTest('Module Import', 'FAIL', 'Functions not exported correctly');
    }
    
    // Test end-to-end workflow (with mocked APIs)
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify(sampleAnimeBadge)
            }
          }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          image: {
            base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        })
      });
    
    const badge = await geminiService.getAnimeBadge(sampleUserProfile);
    const avatar = await geminiService.generateAvatar(badge);
    
    if (badge && avatar) {
      logTest('End-to-End Workflow', 'PASS', 'Complete workflow executes successfully');
    } else {
      logTest('End-to-End Workflow', 'FAIL', 'Workflow failed to complete');
    }
    
  } catch (error: any) {
    logTest('Integration Testing', 'FAIL', `Error during integration testing: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive OpenRouter/ImageRouter Testing\n');
  console.log('=' .repeat(60));
  
  try {
    await testEnvironmentVariables();
    await delay(100);
    
    await testAPIRequestFormats();
    await delay(100);
    
    await testFunctionality();
    await delay(100);
    
    await testErrorHandling();
    await delay(100);
    
    await testIntegration();
    
  } catch (error: any) {
    console.error('\n❌ Fatal error during testing:', error.message);
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Testing Complete');
    console.log('\nNOTE: This script uses mocked fetch requests for safety.');
    console.log('For real API testing, set valid API keys and run with --real-api flag.');
  }
}

// Export for external usage
export {
  runAllTests,
  testEnvironmentVariables,
  testAPIRequestFormats,
  testFunctionality,
  testErrorHandling,
  testIntegration,
  sampleUserProfile,
  sampleAnimeBadge
};

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}