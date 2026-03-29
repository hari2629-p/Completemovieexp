import axios from 'axios'

const BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },
})

export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
export const IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original'

/**
 * Fetch movies by genre IDs with optional language filter
 */
export async function getMoviesByGenres({ genreIds, language = 'en', page = 1 }) {
  const originalLang = ISO_LANG_CODES[language] || 'en'
  const { data } = await tmdb.get('/discover/movie', {
    params: {
      with_genres: genreIds.join(','), // AND logic: MUST have all target genres
      language: 'en-US', // Always fetch English titles & overviews
      with_original_language: originalLang, // Filter by regional industry
      sort_by: 'popularity.desc',
      'vote_count.gte': 10,
      page,
    },
  })
  return data
}

/**
 * Fetch top-rated movies as fallback
 */
export async function getTopRatedMovies({ language = 'en', page = 1 }) {
  const originalLang = ISO_LANG_CODES[language] || 'en'
  const { data } = await tmdb.get('/discover/movie', {
    params: { 
      language: 'en-US', // Always English metadata
      with_original_language: originalLang, // Filter by regional industry
      sort_by: 'vote_average.desc',
      'vote_count.gte': 150,
      page 
    },
  })
  return data
}

/**
 * Fetch movie details
 */
export async function getMovieDetails(movieId) {
  const { data } = await tmdb.get(`/movie/${movieId}`, {
    params: { append_to_response: 'credits,reviews' },
  })
  return data
}

/**
 * Fetch movie reviews
 */
export async function getMovieReviews(movieId) {
  const { data } = await tmdb.get(`/movie/${movieId}/reviews`)
  return data.results || []
}

/**
 * Fetch movie watch providers (OTT streaming platforms)
 */
export async function getMovieWatchProviders(movieId) {
  const { data } = await tmdb.get(`/movie/${movieId}/watch/providers`)
  // Default to IN (India) data, fallback to US if empty, or just return IN
  return data.results?.IN || data.results?.US || null
}

/**
 * Search movies by query
 */
export async function searchMovies(query, language = 'en') {
  // Always fetch English metadata for search
  const { data } = await tmdb.get('/search/movie', {
    params: { query, language: 'en-US' },
  })
  return data
}

// Language code map (for translation)
const LANGUAGE_CODES = {
  Malayalam: 'ml-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Hindi: 'hi-IN',
  Kannada: 'kn-IN',
  Marathi: 'mr-IN',
  Bengali: 'bn-IN',
  English: 'en-US',
  Korean: 'ko-KR',
  French: 'fr-FR',
  Spanish: 'es-ES',
  Japanese: 'ja-JP',
}

// ISO Language map (for filtering original language)
const ISO_LANG_CODES = {
  Malayalam: 'ml',
  Tamil: 'ta',
  Telugu: 'te',
  Hindi: 'hi',
  Kannada: 'kn',
  Marathi: 'mr',
  Bengali: 'bn',
  English: 'en',
  Korean: 'ko',
  French: 'fr',
  Spanish: 'es',
  Japanese: 'ja',
}
