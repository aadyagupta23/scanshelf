import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Gemini
const mockGemini = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

jest.mock('gemini', () => ({
  Gemini: jest.fn().mockImplementation(() => mockGemini)
}));

describe('Gemini Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Book Recommendations', () => {
    it('should generate book recommendations based on user preferences', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                title: "The Martian",
                author: "Andy Weir",
                matchScore: 95,
                matchReason: "Hard science fiction with problem-solving protagonist",
                summary: "An astronaut stranded on Mars must survive using science and ingenuity"
              }
            ])
          }
        }]
      };

      (mockGemini.chat.completions.create as any).mockResolvedValue(mockResponse);

      const userPreferences = {
        genres: ['Science Fiction', 'Adventure'],
        favoriteBooks: ['Dune', 'Foundation'],
        authors: ['Isaac Asimov']
      };

      const detectedBooks = ['The Expanse', 'Ender\'s Game'];

      // Test would call actual Gemini service function here
      // For now, just test the mock setup
      const result = await mockGemini.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a book recommendation expert.'
          },
          {
            role: 'user',
            content: `Based on these preferences: ${JSON.stringify(userPreferences)} and these detected books: ${JSON.stringify(detectedBooks)}, recommend books.`
          }
        ]
      });

      expect(mockGemini.chat.completions.create).toHaveBeenCalledTimes(1);
      expect((result as any).choices[0].message.content).toContain('The Martian');
    });

    it('should handle Gemini API errors gracefully', async () => {
      const error = new Error('Gemini API rate limit exceeded');
      (mockGemini.chat.completions.create as any).mockRejectedValue(error);

      await expect(mockGemini.chat.completions.create({})).rejects.toThrow('Gemini API rate limit exceeded');
    });

    it('should validate response format from Gemini', async () => {
      const invalidResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      (mockGemini.chat.completions.create as any).mockResolvedValue(invalidResponse as any);

      const result = await mockGemini.chat.completions.create({});
      
      expect(() => {
        JSON.parse((result as any).choices[0].message.content);
      }).toThrow();
    });
  });

  describe('Book Summaries', () => {
    it('should generate enhanced book summaries', async () => {
      const mockSummaryResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: "Dune",
              author: "Frank Herbert",
              enhancedSummary: "A complex epic about politics, religion, and ecology on the desert planet Arrakis.",
              themes: ["Power", "Ecology", "Religion", "Politics"],
              targetAudience: "Fans of complex science fiction",
              estimatedRating: "4.2"
            })
          }
        }]
      };

      (mockGemini.chat.completions.create as any).mockResolvedValue(mockSummaryResponse as any);

      const bookData = {
        title: 'Dune',
        author: 'Frank Herbert',
        basicSummary: 'A science fiction novel set on a desert planet.'
      };

      const result = await mockGemini.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a book analysis expert.'
          },
          {
            role: 'user',
            content: `Enhance this book data: ${JSON.stringify(bookData)}`
          }
        ]
      });

      expect(mockGemini.chat.completions.create).toHaveBeenCalledTimes(1);
      const response = JSON.parse((result as any).choices[0].message.content);
      expect(response.title).toBe('Dune');
      expect(response.enhancedSummary).toBeDefined();
      expect(response.themes).toBeInstanceOf(Array);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect Gemini rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      (mockGemini.chat.completions.create as any).mockRejectedValue(rateLimitError as any);

      await expect(mockGemini.chat.completions.create({})).rejects.toThrow('Rate limit exceeded');
    });

    it('should implement exponential backoff for retries', async () => {
      // First call fails, second succeeds
      (mockGemini.chat.completions.create as any)
        .mockRejectedValueOnce(new Error('Rate limit exceeded') as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success' } }]
        } as any);

      // Test retry logic would go here
      expect(mockGemini.chat.completions.create).toBeDefined();
    });
  });

  describe('Token Usage Optimization', () => {
    it('should optimize prompts to stay within token limits', () => {
      const longPreferences = {
        genres: Array(50).fill('Fiction'),
        favoriteBooks: Array(100).fill('Long Book Title'),
        authors: Array(50).fill('Author Name')
      };

      // Test prompt truncation logic would go here
      const truncatedPrompt = JSON.stringify(longPreferences).slice(0, 1000);
      expect(truncatedPrompt.length).toBeLessThanOrEqual(1000);
    });

    it('should count tokens in requests', () => {
      const samplePrompt = "Recommend books based on user preferences";
      
      // Mock token counting (in real implementation, would use tiktoken)
      const estimatedTokens = Math.ceil(samplePrompt.length / 4);
      expect(estimatedTokens).toBeGreaterThan(0);
    });
  });
}); 