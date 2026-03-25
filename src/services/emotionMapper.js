/**
 * emotionMapper.js
 * Maps detected emotions + user preferences to TMDB genre IDs
 * and calculates an Emotional Relevance Score (0–100)
 */

// TMDB Genre ID reference
export const GENRES = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  Western: 37,
}

// Emotion → Genre names  (uplift = feel better, match = mirror current mood)
const EMOTION_GENRE_MAP = {
  happy: {
    uplift: ['Comedy', 'Adventure', 'Animation', 'Music'],
    match:  ['Comedy', 'Action', 'Adventure', 'Romance'],
  },
  sad: {
    uplift: ['Comedy', 'Animation', 'Family', 'Music', 'Adventure'],
    match:  ['Drama', 'Romance', 'Music'],
  },
  angry: {
    uplift: ['Comedy', 'Animation', 'Adventure', 'Fantasy'],
    match:  ['Action', 'Crime', 'Thriller'],
  },
  surprised: {
    uplift: ['Comedy', 'Adventure', 'Mystery'],
    match:  ['Thriller', 'Mystery', 'Sci-Fi'],
  },
  fearful: {
    uplift: ['Animation', 'Comedy', 'Family', 'Adventure'],
    match:  ['Horror', 'Thriller', 'Mystery'],
  },
  disgusted: {
    uplift: ['Comedy', 'Documentary', 'Animation'],
    match:  ['Drama', 'Documentary'],
  },
  neutral: {
    uplift: ['Action', 'Adventure', 'Sci-Fi', 'Fantasy'],
    match:  ['Drama', 'Thriller', 'Mystery', 'Documentary'],
  },
}

// Emoji map per emotion
export const EMOTION_EMOJI = {
  happy:     '😄',
  sad:       '😢',
  angry:     '😠',
  surprised: '😲',
  fearful:   '😨',
  disgusted: '🤢',
  neutral:   '😐',
}

// Color map per emotion
export const EMOTION_COLOR = {
  happy:     '#f59e0b',
  sad:       '#3b82f6',
  angry:     '#ef4444',
  surprised: '#8b5cf6',
  fearful:   '#06b6d4',
  disgusted: '#10b981',
  neutral:   '#94a3b8',
}

/**
 * Get TMDB genre IDs for a mood + preference combination
 * @param {string} emotion - detected emotion key
 * @param {string} copingStyle - 'uplift' | 'match'
 * @param {string[]} preferredGenres - user's preferred genre names
 * @returns {number[]} array of TMDB genre IDs
 */
export function getGenreIdsForMood(emotion, copingStyle, preferredGenres = []) {
  const mood = emotion?.toLowerCase() || 'neutral'
  const style = copingStyle || 'uplift'
  const moodGenres = EMOTION_GENRE_MAP[mood]?.[style] || EMOTION_GENRE_MAP.neutral.uplift

  // Merge mood genres with user preferred genres (deduplicated)
  const merged = [...new Set([...moodGenres, ...preferredGenres])]

  // Map to TMDB IDs, filter out unknowns
  const ids = merged
    .map(name => GENRES[name])
    .filter(Boolean)

  // Always return at least the top 3 mood genres
  if (ids.length === 0) {
    return moodGenres.slice(0, 3).map(n => GENRES[n]).filter(Boolean)
  }

  return ids.slice(0, 5) // TMDB works best with ≤5 genre filters
}

/**
 * Calculate Emotional Relevance Score (0–100)
 * @param {object} movie        - TMDB movie object
 * @param {string} emotion      - detected emotion
 * @param {string} copingStyle  - 'uplift' | 'match'
 * @param {string[]} preferredGenres
 * @param {string[]} preferredLanguages
 */
export function calcRelevanceScore(movie, emotion, copingStyle, preferredGenres = [], preferredLanguages = []) {
  let score = 40 // base

  const mood = emotion?.toLowerCase() || 'neutral'
  const style = copingStyle || 'uplift'
  const moodGenres = EMOTION_GENRE_MAP[mood]?.[style] || []

  const movieGenreIds = movie.genre_ids || []
  const moodGenreIds = moodGenres.map(n => GENRES[n]).filter(Boolean)
  const prefGenreIds = preferredGenres.map(n => GENRES[n]).filter(Boolean)

  // -- Genre overlap with mood genres (up to +25)
  const moodMatches = movieGenreIds.filter(id => moodGenreIds.includes(id)).length
  score += Math.min(moodMatches * 10, 25)

  // -- Genre overlap with user preferred genres (up to +15)
  const prefMatches = movieGenreIds.filter(id => prefGenreIds.includes(id)).length
  score += Math.min(prefMatches * 8, 15)

  // -- Language match (up to +10)
  const LANG_CODE_MAP = {
    English: 'en', Hindi: 'hi', Tamil: 'ta', Telugu: 'te',
    Korean: 'ko', French: 'fr', Spanish: 'es', Japanese: 'ja',
  }
  const movieLang = movie.original_language
  const langMatch = preferredLanguages.some(l => LANG_CODE_MAP[l] === movieLang)
  if (langMatch) score += 10

  // -- Rating bonus (higher rated = more relevant, up to +10)
  const rating = movie.vote_average || 0
  score += Math.round((rating / 10) * 10)

  return Math.min(Math.max(Math.round(score), 0), 100)
}

/**
 * Get human-readable label for emotion
 */
export function getEmotionLabel(emotion) {
  const labels = {
    happy: 'Happy', sad: 'Sad', angry: 'Angry',
    surprised: 'Surprised', fearful: 'Anxious',
    disgusted: 'Disgusted', neutral: 'Neutral',
  }
  return labels[emotion?.toLowerCase()] || 'Neutral'
}
