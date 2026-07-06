import Tesseract from 'tesseract.js';
import { log } from './simple-logger.js';

/**
 * Analyze an image using Tesseract.js OCR
 * Replaces the previous Google Vision API integration
 * 
 * @param base64Image Base64-encoded image data
 * @returns Object with extracted text, labels, and bookshelf detection
 */
export async function analyzeImage(base64Image: string): Promise<any> {
  try {
    // Remove data URL prefix if present and ensure proper formatting
    let imageContent = base64Image;
    if (imageContent.includes(',')) {
      imageContent = imageContent.split(',')[1];
    }

    if (!imageContent || imageContent.length < 100) {
      throw new Error('Invalid image data provided');
    }

    log(`Processing image with Tesseract.js OCR, content length: ${imageContent.length}`);

    // Convert base64 to a buffer for Tesseract
    const imageBuffer = Buffer.from(imageContent, 'base64');

    // Run OCR using Tesseract.js
    const result = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: () => {} // suppress progress logs
    });

    const extractedText = result.data.text || '';

    log(`Tesseract OCR extracted ${extractedText.length} characters of text`);

    // Simple heuristic to determine if this might be a bookshelf image
    // Based on the structure of extracted text (multiple short lines suggest book spines)
    const lines = extractedText.split('\n').filter((line: string) => line.trim().length > 0);
    const isBookshelf = lines.length >= 3; // Multiple lines of text suggest multiple book spines

    return {
      isBookshelf,
      text: extractedText,
      labels: []
    };
  } catch (error) {
    log(`Error analyzing image with Tesseract: ${error instanceof Error ? error.message : String(error)}`, 'vision');

    // Return empty data so that the user knows there was an error
    return {
      isBookshelf: false,
      text: "Error analyzing image. Please try again with a clearer photo.",
      labels: []
    };
  }
}
