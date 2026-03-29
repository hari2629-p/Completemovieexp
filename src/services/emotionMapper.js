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

export const GENRE_NAMES = Object.keys(GENRES).reduce((acc, key) => {
  acc[GENRES[key]] = key
  return acc
}, {})

// Emotion → Exact 2-genre thematic pairs (for strict AND logic)
const EMOTION_GENRE_MAP = {
  happy: {
    uplift: ['Comedy', 'Family'], // Family Comedies
    match:  ['Comedy', 'Romance'], // Rom-Coms
  },
  sad: {
    uplift: ['Comedy', 'Adventure'], // Fun adventure distractions
    match:  ['Drama', 'Romance'], // Romantic dramas (cathartic)
  },
  angry: {
    uplift: ['Comedy', 'Action'], // Action Comedies (fun release)
    match:  ['Action', 'Thriller'], // Intense Action Thrillers
  },
  surprised: {
    uplift: ['Adventure', 'Fantasy'], // Exciting Fantasy
    match:  ['Mystery', 'Thriller'], // Suspense/Mystery
  },
  fearful: {
    uplift: ['Comedy', 'Animation'], // Comforting animations
    match:  ['Horror', 'Thriller'], // Pure horror/suspense
  },
  disgusted: {
    uplift: ['Comedy', 'Romance'], // Lighthearted rom-coms
    match:  ['Drama', 'Mystery'], // Grounded dramatic mysteries
  },
  neutral: {
    uplift: ['Action', 'Adventure'], // Big Action/Adventure blockbusters
    match:  ['Drama', 'Thriller'], // Engaging dramatic thrillers
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
 * @returns {number[]} array of TMDB genre IDs
 */
export function getGenreIdsForMood(emotion, copingStyle) {
  const mood = emotion?.toLowerCase() || 'neutral'
  const style = copingStyle || 'uplift'
  const moodGenres = EMOTION_GENRE_MAP[mood]?.[style] || EMOTION_GENRE_MAP.neutral.uplift

  // Map to TMDB IDs, filter out unknowns
  const ids = moodGenres
    .map(name => GENRES[name])
    .filter(Boolean)

  return ids.slice(0, 2) // We use exactly 2 for strict AND matching
}

/**
 * Calculate Emotional Relevance Score (0–100)
 * @param {object} movie        - TMDB movie object
 * @param {string} emotion      - detected emotion
 * @param {string} copingStyle  - 'uplift' | 'match'
 * @param {string[]} preferredLanguages
 */
export function calcRelevanceScore(movie, emotion, copingStyle, preferredLanguages = []) {
  let score = 40 // base

  const mood = emotion?.toLowerCase() || 'neutral'
  const style = copingStyle || 'uplift'
  const moodGenres = EMOTION_GENRE_MAP[mood]?.[style] || []

  const movieGenreIds = movie.genre_ids || []
  const moodGenreIds = moodGenres.map(n => GENRES[n]).filter(Boolean)

  // -- Genre overlap with mood genres (up to +40)
  const moodMatches = movieGenreIds.filter(id => moodGenreIds.includes(id)).length
  score += Math.min(moodMatches * 20, 40)

  // -- Language match (up to +10)
  const LANG_CODE_MAP = {
    English: 'en', Hindi: 'hi', Tamil: 'ta', Telugu: 'te', Malayalam: 'ml',
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
