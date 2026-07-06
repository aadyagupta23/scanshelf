# Scanshelf

Turn a bookshelf photo into personalized book recommendations.

Scanshelf identifies books from an uploaded shelf image, enriches them with book metadata, and ranks them against your reading preferences. It uses local OCR for image text extraction and Groq's free tier for optional AI refinement, summaries, ratings, and recommendation reasoning.

## Features

- Scan bookshelf photos and detect visible book titles
- Match detected titles to book metadata
- Add genres, authors, and Goodreads CSV data for personalization
- Generate ranked recommendations from the detected books
- Save books to a device-based reading list
- Cache book data to reduce repeated API calls

## Tech Stack

- Frontend: React, TypeScript, TailwindCSS, Vite
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Drizzle ORM
- AI/OCR: Tesseract.js locally, Groq API for free-tier text generation

## Local Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file from `.env.example` and set:

```bash
DATABASE_URL=your_database_url
GROQ_API_KEY=your_groq_key_here
ENABLE_GROQ=true
```

Start the app:

```bash
npm run dev
```

The app runs at http://localhost:5000.

## Free Model Recommendation

Use Groq with `llama-3.3-70b-versatile` for text tasks. It has a free tier, works well for recommendation reasoning, and is already wired through `server/groq-client.ts`.

Image recognition is handled with local Tesseract.js OCR first, so the app no longer needs Google Vision. If Groq is unavailable or rate limited, OCR-only fallback still returns possible titles.

## Useful Commands

```bash
npm run check
npm run build
npm run test:server
```

On Windows PowerShell, use `npm.cmd` if script execution is blocked:

```bash
npm.cmd run check
```
