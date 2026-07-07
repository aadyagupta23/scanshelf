import groq, { GROQ_MODEL, isGroqConfigured } from "./groq-client.js";
import { log } from './simple-logger.js';
import { rateLimiter } from './rate-limiter.js';

/**
 * Get book recommendations using Groq AI
 * This ensures all recommendations come directly from AI
 * 
 * @param userBooks Array of books the user has read/saved
 * @param preferences User preferences (genres, authors, etc.)
 * @param _deviceId Optional user device ID for analytics (unused)
 * @returns Array of book recommendations
 */
export async function getGeminiRecommendations(
  userBooks: Array<{ title: string, author: string }>,
  preferences: { genres?: string[], authors?: string[] } = {},
  _deviceId?: string
): Promise<Array<{ 
  title: string, 
  author: string, 
  coverUrl?: string, 
  summary?: string,
  rating?: string,
  isbn?: string,
  categories?: string[],
  matchScore?: number,
  matchReason?: string
}>> {
  try {
    // Check if Groq is configured
    if (!isGroqConfigured()) {
      log('Groq API key not configured for recommendations', 'groq');
      throw new Error("Groq API key is required for recommendations");
    }
    
    // Check rate limits and atomically increment if allowed
    if (!(await rateLimiter.checkAndIncrement('groq'))) {
      log('Rate limit reached for Groq, unable to generate recommendations', 'groq');
      throw new Error("Rate limit reached for AI recommendations");
    }
    
    // Generate recommendations using Groq
    log(`Generating recommendations based on ${userBooks.length} books`, 'groq');
    
    try {
      // Create a list of book titles and authors from the input
      const bookTitlesAndAuthors = userBooks.map(book => ({
        title: book.title,
        author: book.author
      }));
      
      // Convert to JSON string for the prompt
      const bookListJSON = JSON.stringify(bookTitlesAndAuthors, null, 2);
      
      // Format user preferences for a richer prompt
      const formattedGenres = preferences.genres && preferences.genres.length > 0 
        ? `Genres I enjoy: ${preferences.genres.join(', ')}.` 
        : '';
      
      const formattedAuthors = preferences.authors && preferences.authors.length > 0 
        ? `Authors I like: ${preferences.authors.join(', ')}.` 
        : '';
      
      // Combine all preference information
      const userPreferencesText = [formattedGenres, formattedAuthors]
        .filter(text => text.length > 0)
        .join(' ');
      
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a literary recommendation expert. Your task is to select books from a provided list that best match the user's specific reading preferences, and provide a brief explanation for each match.

CRITICAL INSTRUCTIONS:
1. You MUST ONLY select books from the exact list provided to you
2. Do NOT invent or suggest books that are not in the provided list
3. Do NOT recommend books that are similar but not on the list
4. The ONLY valid recommendations are books EXPLICITLY listed in the JSON array I will provide
5. Recommend at least 3 books. You may recommend more (up to 7) only if they closely align with the user's stated genres, authors, or reading preferences.
6. Base your selections on how well each book aligns with the user's stated genre preferences and favorite authors
7. For each book, provide a SPECIFIC, CONCISE reason (1-2 sentences) explaining the match
8. Match reasons should ONLY reference preferences the user explicitly mentioned - no assumptions
9. Higher scoring books should have more specific, compelling match reasons`
          },
          {
            role: "user",
            content: `Here is my list of books:
            
${bookListJSON}

My reading preferences:
${userPreferencesText || "I'm open to discovering interesting books from various genres."}

From ONLY this list above, recommend at least 3 books (up to 7, only if they closely align with my reading preferences) that best match my preferences.

Format your response as a JSON object with a "recommendations" array containing ONLY books from my list.
Each recommendation should include:
- title: The exact book title from my list
- author: The exact author name from my list
- matchScore: A number between 1-100 indicating how well this book matches my preferences
- matchReason: A SPECIFIC, CONCISE reason (1-2 sentences) why this book matches my preferences. DO NOT use generic phrases like "aligns with your interests" - explain exactly HOW it connects to my stated preferences. For high scores (80+), the reason should be especially clear and compelling.

IMPORTANT: You can ONLY recommend books from the list I provided. Do not suggest any books that aren't on this list.

Example format:
{
  "recommendations": [
    {
      "title": "Book Title From My List",
      "author": "Author From My List",
      "matchScore": 95,
      "matchReason": "This book directly addresses your interest in [specific genre/topic] with [specific element] that connects to your preference for [specific author/style]."
    }
  ]
}

Only return the JSON object with no additional text.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      });
      
      // Parse the recommendations
      const content = response.choices[0].message.content;
      if (!content) {
        log("Empty response from Groq API", 'groq');
        throw new Error("Groq API returned an empty response");
      }
      
      try {
        log(`Raw Groq response: ${content.substring(0, 200)}...`, 'groq');
        
        const parsed = JSON.parse(content);
        
        // Check if we have recommendations in the expected format
        if (parsed.recommendations && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
          log(`Successfully parsed ${parsed.recommendations.length} recommendations from Groq`, 'groq');
          
          // Create a map of books from the user's list for easy lookup
          const userBooksMap = new Map();
          userBooks.forEach(book => {
            const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
            userBooksMap.set(key, book);
          });
          
          // Validate that each recommendation is from the user's book list
          const validatedRecommendations = parsed.recommendations.filter((rec: any) => {
            if (!rec.title || !rec.author) {return false;}
            
            const key = `${rec.title.toLowerCase()}|${rec.author.toLowerCase()}`;
            const isInUserBooks = userBooksMap.has(key);
            
            if (!isInUserBooks) {
              log(`Filtering out recommendation "${rec.title}" as it's not in the user's book list`, 'groq');
            }
            
            return isInUserBooks;
          }).map((rec: any) => {
            const key = `${rec.title.toLowerCase()}|${rec.author.toLowerCase()}`;
            const originalBook = userBooksMap.get(key);
            
            return {
              ...rec,
              coverUrl: originalBook.coverUrl || rec.coverUrl,
              isbn: originalBook.isbn || rec.isbn,
              matchReason: rec.matchReason || `This book scores ${rec.matchScore || 75}/100 for your reading preferences.`
            };
          });
          
          log(`Validated ${validatedRecommendations.length} recommendations are from the user's book list`, 'groq');
          return validatedRecommendations;
        }
        
        // If not in the expected format but we have an array, try to use that with validation
        if (Array.isArray(parsed) && parsed.length > 0) {
          log(`Found ${parsed.length} recommendations in array format from Groq`, 'groq');
          
          const userBooksMap = new Map();
          userBooks.forEach(book => {
            const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
            userBooksMap.set(key, book);
          });
          
          const validatedRecommendations = parsed.filter((rec: any) => {
            if (!rec.title || !rec.author) {return false;}
            const key = `${rec.title.toLowerCase()}|${rec.author.toLowerCase()}`;
            return userBooksMap.has(key);
          }).map((rec: any) => {
            const key = `${rec.title.toLowerCase()}|${rec.author.toLowerCase()}`;
            const originalBook = userBooksMap.get(key);
            
            return {
              ...rec,
              coverUrl: originalBook.coverUrl || rec.coverUrl,
              isbn: originalBook.isbn || rec.isbn,
              matchReason: rec.matchReason || `This book scores ${rec.matchScore || 75}/100 for your reading preferences.`
            };
          });
          
          log(`Validated ${validatedRecommendations.length} recommendations are from the user's book list`, 'groq');
          return validatedRecommendations;
        }
        
        log("No valid recommendations structure found in Groq response", 'groq');
        throw new Error("Could not extract valid book recommendations from Groq response");
      } catch (error) {
        log(`Error parsing Groq recommendations: ${error instanceof Error ? error.message : String(error)}`, 'groq');
        throw new Error("Failed to parse Groq book recommendations");
      }
    } catch (error) {
      log(`Error from Groq API: ${error instanceof Error ? error.message : String(error)}`, 'groq');
      throw new Error(`Failed to generate book recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    log(`Error generating Groq recommendations: ${error instanceof Error ? error.message : String(error)}`, 'groq');
    throw error;
  }
}
