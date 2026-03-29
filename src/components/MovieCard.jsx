import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IMAGE_BASE, getMovieReviews } from '../services/tmdbService'
import './MovieCard.css'

function MovieCard({ movie, relevanceScore, coping, index = 0 }) {
  const [flipped, setFlipped] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [review, setReview] = useState(null)
  const [loadingReview, setLoadingReview] = useState(false)

  // Fetch review when card is flipped for the first time
  useEffect(() => {
    if (flipped && !review && !loadingReview) {
      setLoadingReview(true)
      getMovieReviews(movie.id)
        .then(res => {
          if (res && res.length > 0) {
            setReview(res[0]) // Get top review
          } else {
            setReview({ empty: true })
          }
        })
        .catch(() => setReview({ empty: true }))
        .finally(() => setLoadingReview(false))
    }
  }, [flipped, movie.id, review, loadingReview])


  const posterUrl = movie.poster_path && !imgError
    ? `${IMAGE_BASE}${movie.poster_path}`
    : null

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A'
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'
  const ratingStars = movie.vote_average ? Math.round(movie.vote_average / 2) : 0
  const overview = movie.overview || 'No overview available.'
  const shortOverview = overview.length > 120 ? overview.slice(0, 120) + '…' : overview

  const scoreColor =
    relevanceScore >= 80 ? '#10b981' :
    relevanceScore >= 60 ? '#8b5cf6' :
    relevanceScore >= 40 ? '#f59e0b' : '#94a3b8'

  return (
    <motion.div
      className={`movie-card ${flipped ? 'flipped' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={() => setFlipped(f => !f)}
      aria-label={`${movie.title} — click to see details`}
    >
      {/* Front */}
      <div className="card-face card-front">
        <div className="card-poster">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="poster-fallback">🎬</div>
          )}

          {/* Relevance badge */}
          <div className="relevance-badge" style={{ '--score-color': scoreColor }}>
            <span className="relevance-score">{relevanceScore}</span>
            <span className="relevance-label">match</span>
          </div>
        </div>

        <div className="card-info">
          <h3 className="card-title">{movie.title}</h3>
          <div className="card-meta">
            <span className="card-year">{releaseYear}</span>
            <span className="card-dot">·</span>
            <div className="stars">
              {'★'.repeat(ratingStars)}{'☆'.repeat(5 - ratingStars)}
            </div>
            <span className="card-rating">{rating}</span>
          </div>
          <p className="card-overview">{shortOverview}</p>
          <span className="card-hint">Tap for details →</span>
        </div>
      </div>

      {/* Back */}
      <div className="card-face card-back">
        <div className="card-back-content">
          <h3 className="card-title-back gradient-text">{movie.title}</h3>

          <div className="score-display" style={{ '--score-color': scoreColor }}>
            <div className="score-ring">
              <svg viewBox="0 0 64 64" className="score-svg">
                <circle cx="32" cy="32" r="28" className="score-track" />
                <circle
                  cx="32" cy="32" r="28"
                  className="score-circle"
                  style={{
                    strokeDashoffset: `${175.9 - (175.9 * relevanceScore / 100)}`,
                    stroke: scoreColor,
                  }}
                />
              </svg>
              <span className="score-number">{relevanceScore}%</span>
            </div>
            <p className="score-text">
              We think this is an <strong>{relevanceScore}%</strong> match to{' '}
              {coping === 'uplift' ? 'help uplift your spirits right now 💙' : 'resonate with how you\'re feeling 🪞'}
            </p>
          </div>
          
          <p className="card-overview-back">{shortOverview}</p>

          <div className="card-review-box">
            {loadingReview ? (
              <p className="review-loading">Loading review...</p>
            ) : review && !review.empty ? (
              <>
                <p className="review-author">💬 <strong>{review.author}</strong> says:</p>
                <p className="review-content">
                  "{review.content.length > 120 ? review.content.slice(0, 120) + '...' : review.content}"
                </p>
                {review.content.length > 120 && (
                  <a
                    href={review.url || `https://www.themoviedb.org/movie/${movie.id}/reviews`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="review-read-more"
                    style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
                    onClick={e => e.stopPropagation()}
                  >
                    Read full review
                  </a>
                )}
              </>
            ) : (
              <p className="review-loading">No reviews yet, but it might be just what you need! ✨</p>
            )}
          </div>

          <div className="card-back-meta">
            <span>📅 {releaseYear}</span>
            <span>⭐ {rating}/10</span>
          </div>

          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary tmdb-link"
            onClick={e => e.stopPropagation()}
          >
            View on TMDB ↗
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default MovieCard
