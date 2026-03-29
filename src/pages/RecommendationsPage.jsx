import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MoodBadge from '../components/MoodBadge'
import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { getGenreIdsForMood, calcRelevanceScore, getEmotionLabel, EMOTION_EMOJI } from '../services/emotionMapper'
import { getMoviesByGenres, getTopRatedMovies } from '../services/tmdbService'
import './RecommendationsPage.css'

const LANG_CODE_MAP = {
  Malayalam: 'ml', Tamil: 'ta', Telugu: 'te', Hindi: 'hi', Kannada: 'kn', Marathi: 'mr', Bengali: 'bn',
  English: 'en', Korean: 'ko', French: 'fr', Spanish: 'es', Japanese: 'ja',
}

const LOADING_MESSAGES = [
  'Finding the perfect movie for you...',
  'Analyzing your mood...',
  'Consulting the movie database...',
]

function RecommendationsPage({ preferences, detectedMood }) {
  const navigate = useNavigate()
  const mood = detectedMood || 'neutral'
  const copingStyle = preferences?.coping?.[mood] || 'uplift'
  const preferredLanguages = preferences?.languages || ['English']

  const [activeLang, setActiveLang] = useState(preferredLanguages[0] || 'English')
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const fetchMovies = useCallback(async (currentPage, lang, reset = false) => {
    try {
      if (reset) setLoading(true)
      else setLoadingMore(true)

      const genreIds = getGenreIdsForMood(mood, copingStyle)
      let data

      try {
        data = await getMoviesByGenres({
          genreIds,
          language: lang,
          page: currentPage,
        })
      } catch {
        // fallback to top-rated
        data = await getTopRatedMovies({ language: lang, page: currentPage })
      }

      const results = data.results || []
      const withScores = results.map(m => ({
        ...m,
        relevanceScore: calcRelevanceScore(m, mood, copingStyle, preferredLanguages),
      })).sort((a, b) => b.relevanceScore - a.relevanceScore)

      setMovies(prev => reset ? withScores : [...prev, ...withScores])
      setTotalPages(data.total_pages || 1)
      setError(null)
    } catch (err) {
      console.error("TMDB Fetch Error:", err)
      
      if (err.response?.status === 401) {
         setError('Authentication failed. The TMDB API key in .env is missing or invalid.')
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
         setError('Network Error: Could not reach TMDB. Your ISP or Ad-Blocker might be blocking the connection.')
      } else {
         setError(`Failed to load movies: ${err.message || 'Unknown network error'}`)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [mood, copingStyle, preferredLanguages])

  // Initial load / language change
  useEffect(() => {
    setPage(1)
    setMovies([])
    fetchMovies(1, activeLang, true)
  }, [activeLang, fetchMovies])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    fetchMovies(next, activeLang, false)
  }

  function handleRetry() {
    setError(null)
    fetchMovies(1, activeLang, true)
  }

  const emotionLabel = getEmotionLabel(mood)
  const emoji = EMOTION_EMOJI[mood] || '😐'

  return (
    <div className="recs-page page-wrapper">
      <div className="container">

        {/* ---- Mood Header ---- */}
        <motion.div
          className="recs-header"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="recs-mood-row">
            <MoodBadge mood={mood} size="lg" />
            <div className="recs-mood-meta">
              <h1 className="recs-title">
                Movies for when you're{' '}
                <span className="gradient-text">{emotionLabel}</span> {emoji}
              </h1>
              <p className="recs-subtitle">
                {copingStyle === 'uplift'
                  ? 'Picked to uplift and energise you 🚀'
                  : 'Matched to your current vibe 🪞'}
                {' '}· Sorted by emotional relevance
              </p>
            </div>
            <button
              className="btn btn-ghost recs-redetect"
              onClick={() => navigate('/detect')}
            >
              🔄 Re-detect Mood
            </button>
          </div>

          {/* Language filter tabs */}
          <div className="lang-tabs">
            {preferredLanguages.map(lang => (
              <button
                key={lang}
                className={`lang-tab ${activeLang === lang ? 'active' : ''}`}
                onClick={() => setActiveLang(lang)}
              >
                {LANG_FLAGS[lang]} {lang}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ---- Error State ---- */}
        {error && (
          <motion.div
            className="recs-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button className="btn btn-primary" onClick={handleRetry}>
              Try Again
            </button>
          </motion.div>
        )}

        {/* ---- Loading Skeleton ---- */}
        {loading && !error && (
          <motion.div 
            className="recs-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingSpinner />
            <AnimatePresence mode="wait">
              <motion.p 
                key={loadingMsgIdx}
                className="recs-loading-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {LOADING_MESSAGES[loadingMsgIdx]}
              </motion.p>
            </AnimatePresence>
            <div className="skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-card shimmer" />
              ))}
            </div>
          </motion.div>
        )}

        {/* ---- Movie Grid ---- */}
        {!loading && !error && (
          <>
            {movies.length === 0 ? (
              <motion.div
                className="recs-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="empty-icon">🎬</div>
                <h3>No movies found</h3>
                <p>Try switching the language tab or updating your preferences.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/survey')}>
                  Update Preferences
                </button>
              </motion.div>
            ) : (
              <>
                <p className="recs-count">
                  Showing <strong>{movies.length}</strong> recommendations
                </p>
                <div className="movie-grid">
                  <AnimatePresence>
                    {movies.map((movie, i) => (
                      <MovieCard
                        key={`${movie.id}-${i}`}
                        movie={movie}
                        relevanceScore={movie.relevanceScore}
                        coping={copingStyle}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Load More */}
                {page < totalPages && (
                  <div className="load-more-row">
                    {loadingMore ? (
                      <LoadingSpinner />
                    ) : (
                      <motion.button
                        className="btn btn-secondary"
                        onClick={handleLoadMore}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Load More Movies ↓
                      </motion.button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Flag emojis for language tabs
const LANG_FLAGS = {
  Malayalam: '🇮🇳', Tamil: '🇮🇳', Telugu: '🇮🇳', Hindi: '🇮🇳', Kannada: '🇮🇳', Marathi: '🇮🇳', Bengali: '🇮🇳',
  English: '🇬🇧', Korean: '🇰🇷', French: '🇫🇷', Spanish: '🇪🇸', Japanese: '🇯🇵',
}

export default RecommendationsPage
