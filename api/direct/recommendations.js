/* eslint-disable no-undef */
// Import using ES modules for Vercel compatibility
import 'dotenv/config';

/**
 * API handler for direct Groq recommendations
 * @param {import('@vercel/node').VercelRequest} req - The request object
 * @param {import('@vercel/node').VercelResponse} res - The response object
 */
export default async function handler(req, res) {

  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the AI recommendations function
    const { getGeminiRecommendations } = await import('../../server/gemini-recommendations.js');
    const { isGroqConfigured } = await import('../../server/groq-client.js');
    const { log } = await import('../../server/simple-logger.js');



    const { books, preferences } = req.body;

    if (!books || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a non-empty array of books"
      });
    }

    // Get device ID from cookie if available
    const deviceId = req.cookies?.deviceId || 'anonymous-user';
    
    log(`Processing direct Groq recommendation request with ${books.length} books`, "groq");

    // Check Groq API key
    if (!isGroqConfigured()) {
      return res.status(400).json({
        success: false,
        message: "Groq API key is not configured. Please add GROQ_API_KEY to your environment variables."
      });
    }
    
    // Log the request details for debugging
    log(`Processing recommendation request for ${books.length} books with preferences: ${JSON.stringify(preferences || {})}`, "groq");
    
    try {
      // Get base recommendations from Gemini
      const baseRecommendations = await getGeminiRecommendations(books, preferences || {}, deviceId);
      
      // Make sure we received recommendations from Gemini
      if (!baseRecommendations || baseRecommendations.length === 0) {
        // If no recommendations were returned, inform the user
        log("No recommendations returned from Gemini", "gemini");
        return res.status(404).json({
          success: false,
          message: "No book recommendations could be generated based on your scanned books. Please try scanning different books."
        });
      }

      // Enhance each recommendation with cached or fresh Gemini data
      const enhancedRecommendations = await Promise.all(baseRecommendations.map(async (book) => {
        try {
          // Find the original book from the user's list to get the cover URL
          const originalBook = books.find(b => 
            b.title.toLowerCase() === book.title.toLowerCase() && 
            b.author.toLowerCase() === book.author.toLowerCase()
          );
          
          // Ensure we have a cover URL from the original scanned book if available
          const coverUrl = originalBook?.coverUrl || book.coverUrl || '';
          
          // Make sure we have an ISBN if it's available in the original book
          const isbn = originalBook?.isbn || book.isbn || '';
          
          // Import bookCacheService for consistent cache access
          let cachedBook = null;
          let description = '';
          let rating = '';
          
          try {
            const { bookCacheService } = await import('../../server/book-cache-service.js');
            
            // First check if we have this recommendation in cache with Gemini data
            cachedBook = await bookCacheService.findInCache(book.title, book.author);
            
            // If no cached book found, wait a moment and try again (handles race condition)
            if (!cachedBook || cachedBook.source !== 'gemini') {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              try {
                cachedBook = await bookCacheService.findInCache(book.title, book.author);
              } catch (retryError) {
                log(`Cache retry lookup error: ${retryError instanceof Error ? retryError.message : String(retryError)}`, "gemini");
              }
            }
          } catch (error) {
            log(`Cache lookup error: ${error instanceof Error ? error.message : String(error)}`, "gemini");
          }
          
          if (cachedBook && cachedBook.source === 'gemini') {
            // Use cached Gemini data if available
            if (cachedBook.summary) {
              description = cachedBook.summary;
            }
            
            if (cachedBook.rating) {
              rating = cachedBook.rating;
            }
          }
          
          // If we still don't have a description, get it from Gemini
          if (!description || description.length < 100) {
            const { getGeminiDescription } = await import('../../server/gemini-descriptions.js');
            description = await getGeminiDescription(book.title, book.author);
          }
          
          // If we still don't have a rating, get it from Gemini
          if (!rating || rating === "0") {
            const { bookCacheService } = await import('../../server/book-cache-service.js');
            rating = await bookCacheService.getEnhancedRating(book.title, book.author, isbn);
          }
          
          // Validate rating value
          if (!rating || isNaN(parseFloat(rating))) {
            log(`Invalid rating detected`, "gemini");
          }
          
          // Use the match reason provided directly from the recommendation
          const matchReason = book.matchReason || "This book matches elements of your reading preferences.";
          
          // Return the enhanced recommendation with Gemini data
          const enhancedBook = {
            title: book.title,
            author: book.author,
            coverUrl: coverUrl,
            summary: description || "A compelling book that explores important themes and ideas.",
            rating: rating || '4.0', // Use the rating (cached or fresh)
            isbn: isbn,
            categories: book.categories || [],
            matchScore: book.matchScore || 75, // Default to 75 if no score available
            matchReason: matchReason || "This book aligns with your reading preferences.",
            fromAI: true
          };
          
          // Log completion
          return enhancedBook;
        } catch (error) {
          // If there's an error with Gemini for this specific book, return basic info
          log(`Book enhancement error: ${error instanceof Error ? error.message : String(error)}`, "gemini");
          
          // Find the original book from the user's list to get the cover URL (even in error case)
          const originalBook = books.find(b => 
            b.title.toLowerCase() === book.title.toLowerCase() && 
            b.author.toLowerCase() === book.author.toLowerCase()
          );
          
          // Ensure we have a cover URL from the original scanned book if available
          const coverUrl = originalBook?.coverUrl || book.coverUrl || '';
          
          // Make sure we have an ISBN if it's available in the original book
          const isbn = originalBook?.isbn || book.isbn || '';
          
          return {
            title: book.title,
            author: book.author,
            coverUrl: coverUrl,
            summary: "A compelling book that explores important themes and ideas.",
            rating: book.rating || '4.0',
            isbn: isbn,
            categories: book.categories || [],
            matchScore: book.matchScore || 75,
            matchReason: book.matchReason || "This book includes themes or styles that connect with your reading preferences.",
            fromAI: true
          };
        }
      }));
      
      log(`Successfully enhanced ${enhancedRecommendations.length} recommendations`, "gemini");
      return res.status(200).json(enhancedRecommendations);
    } catch (error) {
      log(`Error generating recommendations: ${error instanceof Error ? error.message : String(error)}`, "gemini");
      return res.status(500).json({
        success: false,
        message: "Failed to generate recommendations",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error) {
    console.error('Direct recommendations API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
