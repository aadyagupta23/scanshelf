# 📚 ScanShelf

> Turn photos of your bookshelf into personalized reading recommendations.

ScanShelf is an AI-powered bookshelf scanner and reading companion. By uploading or taking a picture of your physical bookshelf, ScanShelf automatically extracts book titles, enriches them with high-fidelity metadata (synopsis, ratings, authors), and compares them against your personal reading tastes to generate matching scores and explanations.

Built with a gorgeous, high-fidelity **Sage Green & Cream design system**, ScanShelf features persistent scan histories, robust preference customization, and an immersive recommendation discovery loop.

---

## ✨ Core Features

### 🔍 AI Bookshelf Scanner
- **Local OCR Engine**: Extracts visible spine text locally via Tesseract.js.
- **AI Refinement**: Corrects and maps raw OCR text to verified titles, authors, and cover art using Gemini/Groq completions.
- **Fallback Resilience**: Works seamlessly with local OCR fallback if AI APIs are rate-limited or unavailable.

### 🧠 Personalized Recommendation Engine
- **Preferences Dashboard**: Set your favorite genres, tags, and authors.
- **Match Explanations**: Every recommendation includes a percentage score and a custom explanation ("Why This Matches You").

### 📖 Immersive Book Details
- **Detailed Modal View**: Explore full synopses and matching rationales.
- **On-Demand Similar Books**: Suggests 3 similar books using Groq.
- **Infinite Discovery**: Click any suggested book to load its details inline and continue finding new reads.
- **Quick CTAs**: Quick links to **Buy on Amazon** or **Save for Later** to add titles to your Reading List.

### 🕒 Persistent Scan History
- **Database Synced**: Automatically records scans into the `scan_sessions` PostgreSQL table.
- **Session Restoration**: Shows a summary thumbnail collage of past scans. Click any past scan to reload the stepper and re-view recommendation results.

### ⚙️ Settings & Exporter
- **Theme Selection**: Toggle between Light Mode (cream accents) and Dark Mode (dark forest green).
- **Notification Preferences**: Local-storage persisted configuration switches.
- **JSON Data Backup**: One-click download of all reading lists, scan history, and device metadata.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Radix UI (Dialog, Accordion)
- **Backend**: Node.js, Express, TypeScript, Multer
- **Database**: PostgreSQL with Drizzle ORM
- **AI Models**: 
  - OCR: Tesseract.js (Local)
  - Summaries & Recommendations: Groq API (`llama-3.3-70b-versatile`)
  - Title Mapping & OCR Refinement: Gemini Vision / OCR API

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/scanshelf
GROQ_API_KEY=your_groq_api_key_here
ENABLE_GROQ=true
PORT=5000
```

### 3. Database Setup & Migrations
Synchronize your local schema with the database:
```bash
npx drizzle-kit push
```

### 4. Run Development Server
```bash
npm run dev
```
The application will be served at `http://localhost:5000` (Express Backend proxied to Vite Frontend).

---

## 📂 Project Directory Structure

```yaml
scanshelf/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI widgets and layout modules
│   │   │   ├── book-scanner/  # Recommendations & Stepper logic
│   │   │   └── ui/         # Radix / Shadcn components (BookDetailModal, Dialog, etc.)
│   │   ├── contexts/       # ThemeContext, DeviceContext
│   │   ├── pages/          # Router pages (books, settings, history, reading list)
│   │   └── lib/            # Utilities (DeviceId syncing, fetch queries)
├── server/                 # Express backend application
│   ├── utils/              # AI helpers (gemini-utils, book-utils)
│   ├── routes.ts           # REST API Route registration
│   ├── storage.ts          # Database and caching layer
│   └── index.ts            # Entrypoint
├── shared/                 # Database Schemas & Types
│   └── schema.ts           # Drizzle table schemas
└── migrations/             # Automatically generated SQL migrations
```

---

## 🧪 Testing & Verification

Run checks and verify components:
```bash
# Typecheck TypeScript files
npm run check

# Run client vitest suite
npm run test:client

# Run server test suite
npm run test:server
```
