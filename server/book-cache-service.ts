import { db } from './db.js';
import { bookCache, type InsertBookCache, type BookCache } from '../shared/schema.js';
import { eq, and, or, sql, lte, gte, isNotNull, not, isNull } from 'drizzle-orm';
import { getEstimatedBookRating } from './utils/book-utils.js';
import { log } from './simple-logger.js';
import groq, { GROQ_MODEL, isGroqConfigured } from './groq-client.js';
import { rateLimiter } from './rate-limiter.js';

// Cache expiration duration in milliseconds
const CACHE_DURATION = {
  GOOGLE: 365 * 24 * 60 * 60 * 1000, // 365 days for Google Books (very stable)
  AMAZON: 7 * 24 * 60 * 60 * 1000,   // 7 days for Amazon (pricing changes)
  GROQ: 365 * 24 * 60 * 60 * 1000,   // 365 days for AI summaries (content doesn't change)
};

// Default cache duration
const DEFAULT_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Book Cache Service - Manages storing and retrieving book information
 * to reduce expensive API calls while maintaining high-quality data
 */
export class BookCacheService {
  /**
   * Find a book in the cache by title and author
   */
  async findInCache(title: string, author: string): Promise<BookCache | undefined> {
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedAuthor = author.toLowerCase().trim();

    try {
      const [exactMatch] = await db.select().from(bookCache).where(
        and(
          eq(sql`LOWER(${bookCache.title})`, normalizedTitle),
          or(
            eq(sql`LOWER(${bookCache.author})`, normalizedAuthor),
            sql`LOWER(${bookCache.author}) LIKE ${`%${normalizedAuthor}%`}`,
            sql`${normalizedAuthor} LIKE CONCAT('%', LOWER(${bookCache.author}), '%')`
          ),
          gte(bookCache.expiresAt, new Date())
        )
      );

      if (exactMatch) {
        log(`Cache hit for "${title}" by ${author}`, 'cache');
        return exactMatch;
      }

      const [partialMatch] = await db.select().from(bookCache).where(
        and(
          or(
            sql`LOWER(${bookCache.title}) LIKE ${`%${normalizedTitle}%`}`,
            sql`${normalizedTitle} LIKE CONCAT('%', LOWER(${bookCache.title}), '%')`
          ),
          or(
            sql`LOWER(${bookCache.author}) LIKE ${`%${normalizedAuthor}%`}`,
            sql`${normalizedAuthor} LIKE CONCAT('%', LOWER(${bookCache.author}), '%')`
          ),
          gte(bookCache.expiresAt, new Date())
        )
      ).limit(1);

      if (partialMatch) {
        log(`Partial cache hit for "${title}" by ${author}`, 'cache');
        return partialMatch;
      }

      log(`Cache miss for "${title}" by ${author}`, 'cache');
      return undefined;
    } catch (error) {
      log(`Error finding book in cache: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      return undefined;
    }
  }

  /**
   * Find a book in the cache by ISBN
   */
  async findByISBN(isbn: string): Promise<BookCache | undefined> {
    if (!isbn || isbn.length < 10) {return undefined;}

    try {
      const [book] = await db.select().from(bookCache).where(
        and(
          eq(bookCache.isbn, isbn),
          gte(bookCache.expiresAt, new Date())
        )
      );

      if (book) {
        log(`ISBN cache hit for ${isbn}`, 'cache');
      } else {
        log(`ISBN cache miss for ${isbn}`, 'cache');
      }

      return book;
    } catch (error) {
      log(`Error finding book by ISBN: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      return undefined;
    }
  }

  /**
   * Save a book to the cache
   */
  async cacheBook(bookData: {
    title: string;
    author: string;
    isbn?: string;
    coverUrl?: string;
    rating?: string;
    summary?: string;
    metadata?: any;
    source?: 'google' | 'amazon' | 'openai' | 'saved';
    expiresAt?: Date;
  }): Promise<BookCache> {
    let source: 'google' | 'amazon' | 'openai' | 'saved';
    
    if (bookData.summary || bookData.rating) {
      source = 'openai';
    } else {
      source = bookData.source || 'google';
    }
    
    try {
      const normalizedTitle = bookData.title.trim();
      const normalizedAuthor = bookData.author.trim();
      
      const [directMatch] = await db.select().from(bookCache).where(
        and(
          eq(sql`LOWER(TRIM(${bookCache.title}))`, normalizedTitle.toLowerCase()),
          eq(sql`LOWER(TRIM(${bookCache.author}))`, normalizedAuthor.toLowerCase())
        )
      );
      
      let expiresAt: Date;
      
      if (bookData.expiresAt) {
        expiresAt = bookData.expiresAt;
      } else {
        const now = new Date();
        let expirationMs = DEFAULT_EXPIRATION;
        
        switch (source) {
          case 'google': expirationMs = CACHE_DURATION.GOOGLE; break;
          case 'amazon': expirationMs = CACHE_DURATION.AMAZON; break;
          case 'openai': expirationMs = CACHE_DURATION.GROQ; break;
          case 'saved': expirationMs = CACHE_DURATION.GROQ; break;
        }
        
        expiresAt = new Date(now.getTime() + expirationMs);
      }

      if (directMatch) {
        const [updated] = await db.update(bookCache)
          .set({
            isbn: bookData.isbn || directMatch.isbn,
            coverUrl: bookData.coverUrl || directMatch.coverUrl,
            rating: bookData.rating || directMatch.rating,
            summary: bookData.summary || directMatch.summary,
            source: source,
            metadata: bookData.metadata || directMatch.metadata,
            expiresAt: expiresAt
          })
          .where(eq(bookCache.id, directMatch.id))
          .returning();

        return updated;
      }
      
      const existing = await this.findInCache(normalizedTitle, normalizedAuthor);
      
      if (existing) {
        const [updated] = await db.update(bookCache)
          .set({
            isbn: bookData.isbn || existing.isbn,
            coverUrl: bookData.coverUrl || existing.coverUrl,
            rating: bookData.rating || existing.rating,
            summary: bookData.summary || existing.summary,
            source: source,
            metadata: bookData.metadata || existing.metadata,
            expiresAt: expiresAt
          })
          .where(eq(bookCache.id, existing.id))
          .returning();

        return updated;
      }
      
      const uniqueId = 
        bookData.isbn || 
        `${normalizedTitle}-${normalizedAuthor}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const insertData: InsertBookCache = {
        title: normalizedTitle,
        author: normalizedAuthor,
        isbn: bookData.isbn || undefined,
        coverUrl: bookData.coverUrl || undefined,
        rating: bookData.rating || undefined,
        summary: bookData.summary || undefined,
        source: source,
        bookId: uniqueId,
        metadata: bookData.metadata || undefined,
        expiresAt: expiresAt
      };
      
      const [inserted] = await db.insert(bookCache).values(insertData).returning();

      return inserted;
    } catch (error) {
      log(`Error caching book: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      throw error;
    }
  }

  /**
   * Remove expired entries from the cache
   */
  async cleanupExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await db.delete(bookCache).where(lte(bookCache.expiresAt, now)).returning();
      const count = result.length;
      
      if (count > 0) {
        log(`Removed ${count} expired entries from book cache`, 'cache');
      }
      
      return count;
    } catch (error) {
      log(`Error cleaning up expired cache: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      return 0;
    }
  }

  /**
   * Get enhanced book summary using Groq AI
   */
  async getEnhancedSummary(
    title: string, 
    author: string, 
    existingSummary?: string
  ): Promise<string | null> {
    try {
      if (!isGroqConfigured()) {
        log('Groq API key not configured for summary generation', 'cache');
        return existingSummary || null;
      }
      
      // Look for cached summary first - prioritize AI content
      const cachedBook = await this.findInCache(title, author);
      if (cachedBook?.summary && cachedBook.source === 'openai') {
        log(`Using cached AI summary for "${title}"`, 'cache');
        return cachedBook.summary;
      }
      
      // Check rate limits
      if (!(await rateLimiter.checkAndIncrement('groq'))) {
        log('Rate limit reached for Groq, skipping summary enhancement', 'cache');
        return existingSummary || null;
      }
      
      log(`Generating enhanced summary for "${title}" by ${author}`, 'cache');
      
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a literary expert providing engaging book summaries. Craft a concise 3-4 sentence summary that captures the essence of the book, its main themes, and what makes it notable. Focus on being informative yet brief."
          },
          {
            role: "user",
            content: `Summarize the book "${title}" by ${author} in 3-4 sentences. Be engaging and highlight what makes this book special. Use only your existing knowledge about this book.`
          }
        ],
        max_tokens: 200,
        temperature: 0.6
      });
      
      const summary = response.choices[0].message.content?.trim() || null;
      
      if (summary) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 120);
        
        const existingBook = await this.findInCache(title, author);
        
        if (existingBook) {
          await db.update(bookCache)
            .set({
              summary: summary,
              source: 'openai',
              expiresAt
            })
            .where(eq(bookCache.id, existingBook.id))
            .returning();
        } else {
          const cacheData = {
            title: title.trim(),
            author: author.trim(),
            summary,
            source: 'openai' as const,
            isbn: undefined,
            coverUrl: undefined,
            rating: undefined,
            metadata: undefined,
            expiresAt
          };
          
          await this.cacheBook(cacheData);
        }
        
        log(`Successfully generated and cached summary for "${title}"`, 'cache');
      }
      
      return summary;
    } catch (error) {
      log(`Error generating summary: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      return existingSummary || null;
    }
  }
  
  /**
   * Get enhanced book rating using Groq AI
   */
  async getEnhancedRating(
    title: string,
    author: string,
    isbn?: string
  ): Promise<string> {
    try {
      // Check for cached rating first
      const cachedBook = await this.findInCache(title, author);
      if (cachedBook?.rating && cachedBook.source === 'openai') {
        log(`Using cached AI rating for "${title}": ${cachedBook.rating}`, 'cache');
        return cachedBook.rating;
      }
      
      // If we have an ISBN, try looking up by that
      if (isbn) {
        const isbnBook = await this.findByISBN(isbn);
        if (isbnBook?.rating) {
          const ratingNum = parseFloat(isbnBook.rating);
          if (!isNaN(ratingNum) && ratingNum >= 1.0 && ratingNum <= 5.0) {
            log(`Using cached ISBN rating for "${title}": ${isbnBook.rating}`, 'cache');
            
            await this.cacheBook({
              title,
              author,
              isbn,
              rating: isbnBook.rating,
              source: isbnBook.source || 'openai'
            });
            
            return isbnBook.rating;
          }
        }
      }
      
      if (!isGroqConfigured()) {
        log('Groq API key not configured for rating generation, using estimate', 'cache');
        return getEstimatedBookRating(title, author);
      }
      
      // Check rate limits
      if (!(await rateLimiter.checkAndIncrement('groq'))) {
        log('Rate limit reached for Groq, using estimate for rating', 'cache');
        return getEstimatedBookRating(title, author);
      }
      
      log(`Generating rating for "${title}" by ${author} using Groq`, 'cache');
      
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a literary expert with extensive knowledge of books and their reception. Your task is to provide an accurate rating for a book based on critical consensus and general reader reception. Base your rating only on your knowledge of this book's reception."
          },
          {
            role: "user",
            content: `Please rate the book "${title}" by ${author} on a scale of 1.0 to 5.0 stars (with one decimal place). Use your knowledge to provide the most accurate rating based on critical reception and reader feedback. Only respond with a single number between 1.0 and 5.0 (with one decimal place). If you don't have sufficient knowledge about this book, provide your best estimate of what its rating would be based on similar works by this author or in this genre.`
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      });
      
      const ratingText = response.choices[0].message.content?.trim() || '';
      log(`Groq response for "${title}" rating: "${ratingText}"`, 'cache');
      
      const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
      let rating = ratingMatch ? ratingMatch[1] : '';
      
      let isAIRating = false;
      if (rating) {
        const ratingNumber = parseFloat(rating);
        if (ratingNumber >= 1.0 && ratingNumber <= 5.0) {
          rating = ratingNumber.toFixed(1);
          isAIRating = true;
        } else {
          rating = getEstimatedBookRating(title, author);
          isAIRating = false;
        }
      } else {
        rating = getEstimatedBookRating(title, author);
        isAIRating = false;
      }
      
      const existingBook = await this.findInCache(title, author);
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      
      if (existingBook) {
        const sourceToUse = isAIRating ? 'openai' : existingBook.source || 'google';
        
        await db.update(bookCache)
          .set({
            rating: rating,
            source: sourceToUse,
            isbn: isbn || existingBook.isbn,
            expiresAt
          })
          .where(eq(bookCache.id, existingBook.id))
          .returning();
      } else {
        const sourceToUse = isAIRating ? 'openai' : 'google';
        
        const cacheData = {
          title: title.trim(),
          author: author.trim(),
          isbn: isbn || undefined,
          rating: rating,
          source: sourceToUse as 'google' | 'amazon' | 'openai' | 'saved',
          coverUrl: undefined,
          summary: undefined,
          metadata: undefined,
          expiresAt
        };
        
        await this.cacheBook(cacheData);
      }
      
      log(`Generated rating for "${title}": ${rating}`, 'cache');
      return rating;
    } catch (error) {
      log(`Error getting enhanced rating: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      return getEstimatedBookRating(title, author);
    }
  }
  
  /**
   * Run maintenance tasks
   */
  async runMaintenance(): Promise<void> {
    try {
      await this.cleanupExpired();
    } catch (error) {
      log(`Error during cache maintenance: ${error instanceof Error ? error.message : String(error)}`, 'cache');
    }
  }
  
  /**
   * Removes non-AI ratings from the cache
   */
  async cleanupNonOpenAIRatings(): Promise<number> {
    try {
      const entries = await db.select().from(bookCache)
        .where(
          and(
            isNotNull(bookCache.rating),
            or(
              not(eq(bookCache.source, 'openai')),
              isNull(bookCache.source)
            )
          )
        );
      
      if (entries.length === 0) {
        log('No non-AI ratings found in cache', 'cache');
        return 0;
      }
      
      let updateCount = 0;
      for (const entry of entries) {
        await db.update(bookCache)
          .set({ rating: null })
          .where(eq(bookCache.id, entry.id));
        updateCount++;
      }
      
      log(`Cleared ratings from ${updateCount} non-AI cache entries`, 'cache');
      return updateCount;
    } catch (error) {
      log(`Error clearing non-AI ratings: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      return 0;
    }
  }
  
  /**
   * Clear cache for testing purposes
   */
  async clearCacheForTesting(options: {
    preserveDescriptions?: boolean;
    titleFilter?: string;
  } = {}): Promise<number> {
    try {
      const { preserveDescriptions = true, titleFilter } = options;
      
      if (preserveDescriptions || titleFilter) {
        const baseQuery = db.select().from(bookCache);
        const query = titleFilter 
          ? baseQuery.where(sql`LOWER(${bookCache.title}) LIKE ${`%${titleFilter.toLowerCase()}%`}`)
          : baseQuery;
        
        const entries = await query;
        const count = entries.length;
        
        if (count === 0) {
          return 0;
        }
        
        const now = new Date();
        const expiry = new Date(now.getTime() - 60000);
        
        let updateCount = 0;
        for (const entry of entries) {
          let updateData: any = { expiresAt: expiry };
          
          if (!preserveDescriptions) {
            updateData = { ...updateData, summary: null };
          }
          
          await db.update(bookCache)
            .set(updateData)
            .where(eq(bookCache.id, entry.id));
          updateCount++;
        }
        
        return updateCount;
      } else {
        const result = await db.delete(bookCache).returning();
        return result.length;
      }
    } catch (error) {
      log(`Error clearing cache for testing: ${error instanceof Error ? error.message : String(error)}`, 'cache');
      return 0;
    }
  }
}

// Create a singleton instance
export const bookCacheService = new BookCacheService();
