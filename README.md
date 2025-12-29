# Scanshelf 

> Turn any bookshelf into smart recommendations instantly.

scanshelf identifies books from a single photo and delivers **personalized recommendations**. No accounts, no friction just scan, discover, and decide.

---

## ✨ What You Can Do

**Scan Full Bookshelves**: Capture multiple books in one photo
**Smart Recommendations**: AI-powered suggestions tailored to your taste
**Understand the Why**: Clear match reasoning for every recommendation
**Save for Later**: Build and manage your personal reading list
**Buy Instantly**: Direct Amazon links when you’re ready to purchase

---

## 🚀 Core Features

### Intelligent Book Discovery

* **Shelf Scanning**: Detects multiple book titles from a single image
* **Metadata Enrichment**: Pulls detailed info from external book APIs
* **AI Summaries & Ratings**: Enhanced descriptions generated on demand
* **Match Reasoning**: Transparent explanation behind each recommendation

### Personalization

* **Goodreads Import**: Upload CSV to personalize recommendations
* **Manual Preferences**: Fine-tune genres, themes, and interests
* **Device-Based Profiles**: No sign-ups — preferences stay on your device

### Performance & Reliability

* **Multi-Layer Caching**: Reduces API calls and improves response times
* **Rate Limiting**: Prevents abuse and controls cost
* **Graceful Degradation**: Core app works even if AI services fail
* **PostgreSQL Monitoring**: Connection health and performance tracking

---

## 🛠 Tech Stack

**Frontend**
React + TypeScript · TailwindCSS · Vite

**Backend**
Node.js · Express.js · TypeScript · PostgreSQL · Drizzle ORM

**AI & APIs**
OpenAI (GPT‑4o) · Google Books API (fallback)

**Infrastructure**
Vercel · Device-based session handling

---

## Local Setup

### Prerequisites

* Node.js 18+
* PostgreSQL (local or cloud)
* OpenAI API key

### Clone Repo

### Environment Variables

Create a `.env` file in the root:

.env.example provided

App runs at **[http://localhost:5000](http://localhost:5000)**


## How It Works

1. **Image Capture** — User photographs a bookshelf
2. **Text Extraction and Book Matching** — Spine text is parsed and cleaned, and then matched
3. **AI Enhancement** — Summaries, ratings, and insights generated
4. **Recommendation Engine** — Personalized recommendations using OpenAI GPT-4o
5. **Caching Layer** — Results stored to minimize repeat costs

---

## 🔐 Security & Privacy

* No accounts or emails collected
* Device-based preference storage
* Built-in rate limiting


## Admin & Debug

Basic monitoring available at `/admin`:

* API usage stats
* Cache health
* System diagnostics


