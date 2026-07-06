import groq, { GROQ_MODEL, isGroqConfigured } from "./groq-client.js";
import { log } from "./simple-logger.js";
import { rateLimiter } from "./rate-limiter.js";
import { analyzeImage } from "./vision.js"; // Tesseract OCR fallback

// This flag allows easier turning on/off of the AI API
const ENABLE_AI = process.env.ENABLE_GROQ !== "false";

/**
 * Main function to analyze a bookshelf image and identify book titles
 * Uses Tesseract.js for OCR then sends extracted text to Groq for title identification
 * Implements rate limiting and cost controls with fallback options
 */
export async function analyzeBookshelfImage(base64Image: string): Promise<{ 
  bookTitles: string[], 
  isBookshelf: boolean 
}> {
  try {
    // Check if AI is enabled and configured
    if (!ENABLE_AI) {
      log("AI API is disabled by configuration", "vision");
      return await fallbackToOCR(base64Image);
    }

    if (!isGroqConfigured()) {
      log("Groq API key is not properly configured", "vision");
      return await fallbackToOCR(base64Image);
    }

    // Check rate limits and atomically increment if allowed
    if (!(await rateLimiter.checkAndIncrement('groq'))) {
      log("Rate limit reached for Groq API. Using fallback.", "vision");
      return await fallbackToOCR(base64Image);
    }

    log("Processing image with Tesseract OCR + Groq AI", "vision");

    // Step 1: Extract text from image using Tesseract OCR
    const ocrResult = await analyzeImage(base64Image);
    const extractedText = ocrResult.text || '';

    if (!extractedText || extractedText.trim().length < 5) {
      log("OCR could not extract sufficient text from image", "vision");
      return { bookTitles: [], isBookshelf: false };
    }

    log(`OCR extracted ${extractedText.length} chars, sending to Groq for title identification`, "vision");

    // Step 2: Send extracted text to Groq to identify book titles
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a precise book identification expert specializing in reading book spines on bookshelves. Your ONLY task is to identify the exact titles of books from OCR-extracted text. Never invent or guess titles. Only include titles where you can clearly identify a complete book title from the text. If you're uncertain about any title, exclude it completely."
        },
        {
          role: "user",
          content: `The following text was extracted from a photo of a bookshelf using OCR. I need you to identify ONLY the books that are clearly identifiable from this text. Parse the text to find complete book titles.\n\nExtracted text:\n${extractedText}\n\nYour response should be a JSON object with these fields:\n\n1. 'bookTitles': An array containing ONLY the exact titles of books you can identify with high certainty from the extracted text. Do not include partial or guessed titles.\n\n2. 'isBookshelf': A boolean (true) if this text appears to come from multiple books on a shelf.\n\nIMPORTANT: Do not try to be helpful by guessing titles! Only include titles that you can clearly identify from the OCR text. For books with series names, include the complete title as shown.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.3
    });

    // Parse the response
    const content = response.choices[0].message.content || '';
    let result;

    try {
      result = JSON.parse(content);
    } catch (error) {
      log(`Error parsing Groq response: ${error}`, "vision");
      // Fallback to basic OCR extraction if JSON parsing fails
      return await fallbackToOCR(base64Image);
    }

    log(`Groq identified ${result.bookTitles?.length || 0} books from OCR text`, "vision");

    return {
      bookTitles: result.bookTitles || [],
      isBookshelf: result.isBookshelf || false
    };
  } catch (error) {
    // Check if this is a rate limit error from the API itself
    if (error instanceof Error && (
      error.message.includes('rate limit') || 
      error.message.includes('429') ||
      error.message.includes('too many requests') ||
      error.message.includes('quota exceeded')
    )) {
      log(`Groq API rate limit error: ${error.message}`, "vision");
      return await fallbackToOCR(base64Image);
    }

    log(`Error analyzing image with Groq: ${error instanceof Error ? error.message : String(error)}`, "vision");

    // Try the fallback option if Groq fails
    return await fallbackToOCR(base64Image);
  }
}

/**
 * Fallback function using only Tesseract OCR without AI enhancement
 * This provides a basic extraction when Groq is unavailable
 */
async function fallbackToOCR(base64Image: string): Promise<{ 
  bookTitles: string[], 
  isBookshelf: boolean 
}> {
  try {
    log("Falling back to Tesseract OCR-only for image analysis", "vision");

    const ocrResult = await analyzeImage(base64Image);

    // Extract potential book titles from the OCR text
    const text = ocrResult.text || '';

    // Very basic extraction of potential book titles from the text
    const lines = text.split('\n').filter((line: string) => line.trim().length > 0);

    // Filter lines that might be book titles (more than 2 words, less than 50 chars)
    const potentialTitles = lines.filter((line: string) => {
      const words = line.trim().split(/\s+/);
      return words.length >= 2 && words.length <= 10 && line.length <= 50;
    });

    log(`OCR fallback extracted ${potentialTitles.length} potential titles`, "vision");

    return {
      bookTitles: potentialTitles,
      isBookshelf: ocrResult.isBookshelf || false
    };
  } catch (error) {
    log(`Error in OCR fallback: ${error instanceof Error ? error.message : String(error)}`, "vision");

    // Return empty results if all methods fail
    return {
      bookTitles: [],
      isBookshelf: false
    };
  }
}
