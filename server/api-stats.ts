import { rateLimiter } from "./rate-limiter.js";

// API statistics monitoring
export async function getApiUsageStats(): Promise<Record<string, any>> {
  const usageStats = await rateLimiter.getUsageStats();
  
  return {
    timestamp: new Date().toISOString(),
    stats: usageStats,
    config: {
      ollamaEnabled: true,
      geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5,
      groqConfigured: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 5,
      localOcrEnabled: true
    }
  };
}
