# MOODFLIX 🎬

> **AI-powered mood-based movie recommendations using real-time facial emotion detection.**

MOODFLIX uses your device camera to detect your emotion and instantly recommends movies that match or uplift your mood — personalized by language, emotion, and coping style preference.

---

## Features

- 🎭 **Real-time emotion detection** via webcam (7 emotions: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral)
- 🎬 **Personalized movie recommendations** from TMDB API
- 🌏 **Regional language support** — Malayalam, Tamil, Telugu, Hindi, Kannada, Marathi, Bengali, English, Korean, French, Spanish, Japanese
- 🧠 **Coping style preference** — "Uplift me" or "Match my vibe"
- 🃏 **Interactive flip cards** with emotional relevance score, user reviews, and Watch Trailer link
- 🎯 **Genre pills** on every card for quick identification
- 📊 **Emotional Relevance Score** (0–100) for each recommendation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Face Detection | `@vladmandic/face-api` (TinyFaceDetector model) |
| Animations | Framer Motion |
| Movie Data | TMDB API (v3) |
| Styling | Vanilla CSS + Glassmorphism |
| Font | Poppins (Google Fonts) |

---

## Emotion → Genre Mapping

The core of MOODFLIX is the `emotionMapper.js` which maps detected emotions to curated TMDB genre pairs using **strict AND logic** (both genres must match).

| Emotion | Uplift Mode | Match Vibe Mode |
|---|---|---|
| 😄 Happy | Comedy + Family | Comedy + Romance |
| 😢 Sad | Comedy + Adventure | Drama + Romance |
| 😠 Angry | Comedy + Action | Action + Thriller |
| 😲 Surprised | Adventure + Fantasy | Mystery + Thriller |
| 😨 Fearful | Comedy + Animation | Horror + Thriller |
| 🤢 Disgusted | Comedy + Romance | Drama + Mystery |
| 😐 Neutral | Action + Adventure | Drama + Thriller |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [TMDB API key](https://www.themoviedb.org/settings/api)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/completemovieexp.git
cd completemovieexp

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and add your TMDB API key
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
# Output is in the dist/ folder
```

---

## Project Structure

```
src/
├── components/
│   ├── MovieCard.jsx       # Flip card with poster, score, review, trailer link
│   ├── MovieCard.css
│   ├── MoodBadge.jsx       # Emotion label badge
│   ├── Navbar.jsx          # Top navigation
│   └── LoadingSpinner.jsx  # Animated loading indicator
│
├── pages/
│   ├── LandingPage.jsx     # Home screen and entry point
│   ├── SurveyPage.jsx      # One-time user preference setup
│   ├── DetectorPage.jsx    # Camera + face-api emotion detection
│   └── RecommendationsPage.jsx  # Movie grid with language tabs
│
├── services/
│   ├── emotionMapper.js    # Emotion → genre ID mapping + relevance scoring
│   └── tmdbService.js      # TMDB API calls (movies, reviews)
│
└── index.css               # Global design tokens + glassmorphism styles
```

---

## How It Works

```
1. User opens app → Preference survey (languages + coping style)
2. Camera activates → face-api runs TinyFaceDetector every 400ms
3. Detected expressions are smoothed over last 5 frames
4. Dominant emotion held for ~2 seconds auto-confirms
5. emotionMapper selects 2 TMDB genre IDs using AND logic
6. TMDB API fetched with language filter + en-US metadata
7. Results scored by Emotional Relevance Score (0–100)
8. Movies displayed sorted by score, filterable by language tab
```

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
# Follow the prompts — add VITE_TMDB_API_KEY as an environment variable
```

### Netlify

```bash
npm run build
# Drag and drop the dist/ folder to netlify.com/drop
# Add VITE_TMDB_API_KEY in Site Settings → Environment Variables
```

---

## Security Notes

- The TMDB API key is stored in `.env` and accessed via `import.meta.env.VITE_TMDB_API_KEY`
- `.env` is excluded from git via `.gitignore`
- All face detection runs **100% locally in the browser** — no video data is ever sent to any server
- The TMDB API key is a public API key with no billing risk, but should still be rotated periodically

---

## Known Limitations

- Bundle size is ~1.7MB due to face-api model weights (normal for on-device ML)
- Requires camera access and a well-lit environment for accurate detection
- TMDB AND-genre filtering may return fewer results for certain combinations

---

## License

MIT © 2025 MOODFLIX