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
  English: 'en', Hindi: 'hi', Tamil: 'ta', Telugu: 'te',
  Korean: 'ko', French: 'fr', Spanish: 'es', Japanese: 'ja',
}

function RecommendationsPage({ preferences, detectedMood }) {
  const navigate = useNavigate()
  const mood = detectedMood || 'neutral'
  const copingStyle = preferences?.coping?.[mood] || 'uplift'
  const preferredGenres = preferences?.genres || []
  const preferredLanguages = preferences?.languages || ['English']

  const [activeLang, setActiveLang] = useState(preferredLanguages[0] || 'English')
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const fetchMovies = useCallback(async (currentPage, lang, reset = false) => {
    try {
      if (reset) setLoading(true)
      else setLoadingMore(true)

      const genreIds = getGenreIdsForMood(mood, copingStyle, preferredGenres)
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
        relevanceScore: calcRelevanceScore(m, mood, copingStyle, preferredGenres, preferredLanguages),
      })).sort((a, b) => b.relevanceScore - a.relevanceScore)

      setMovies(prev => reset ? withScores : [...prev, ...withScores])
      setTotalPages(data.total_pages || 1)
      setError(null)
    } catch (err) {
      setError('Could not fetch movies. Check your TMDB API key in .env and try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [mood, copingStyle, preferredGenres, preferredLanguages])

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
          <div className="recs-loading">
            <LoadingSpinner />
            <p className="recs-loading-text">Finding your perfect movies…</p>
            <div className="skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-card shimmer" />
              ))}
            </div>
          </div>
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
  English: '🇬🇧', Hindi: '🇮🇳', Tamil: '🇮🇳', Telugu: '🇮🇳',
  Korean: '🇰🇷', French: '🇫🇷', Spanish: '🇪🇸', Japanese: '🇯🇵',
}

export default RecommendationsPage
