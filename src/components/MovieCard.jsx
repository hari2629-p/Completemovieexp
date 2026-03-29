import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { IMAGE_BASE, getMovieDetailedInfo } from '../services/tmdbService'
import { GENRE_NAMES } from '../services/emotionMapper'
import './MovieCard.css'

export default function MovieCard({ movie, relevanceScore }) {
  const [imgError, setImgError] = useState(false)
  
  // Hover expansion state
  const [isExpanded, setIsExpanded] = useState(false)
  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const hoverTimeout = useRef(null)

  const handleMouseEnter = () => {
    // Only apply hover logic on desktop implicitly (mobile uses tap)
    if (window.innerWidth > 768) {
      hoverTimeout.current = setTimeout(() => {
        expandCard()
      }, 400) // 400ms delay to prevent flashing
    }
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
    }
    setIsExpanded(false)
  }

  const toggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else {
      expandCard()
    }
  }

  const expandCard = () => {
    setIsExpanded(true)
    if (!details && !loadingDetails) {
      setLoadingDetails(true)
      getMovieDetailedInfo(movie.id)
        .then(res => setDetails(res))
        .catch(() => setDetails({ error: true }))
        .finally(() => setLoadingDetails(false))
    }
  }

  const posterUrl = movie.poster_path && !imgError
    ? `${IMAGE_BASE}${movie.poster_path}`
    : null

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A'
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'
  const matchPercentage = relevanceScore || 0
  
  const scoreColor =
    matchPercentage >= 80 ? '#10b981' :
    matchPercentage >= 60 ? '#8b5cf6' :
    matchPercentage >= 40 ? '#f59e0b' : '#94a3b8'

  const shortOverview = movie.overview 
    ? (movie.overview.length > 180 ? movie.overview.slice(0, 180) + '...' : movie.overview)
    : 'No synopsis available.'

  return (
    <motion.div 
      className="movie-card-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={toggleExpand}
    >
      <div className={`movie-card-content ${isExpanded ? 'expanded' : ''}`}>
        
        {/* Top Poster Area */}
        <div className="card-poster-container">
          {posterUrl ? (
            <img 
              src={posterUrl} 
              alt={movie.title} 
              onError={() => setImgError(true)}
              className="poster-img"
            />
          ) : (
            <div className="poster-fallback">🎬</div>
          )}

          {/* Gradient Overlay for Text Readability */}
          <div className="poster-overlay"></div>

          {/* Top Right Match Badge */}
          <div className="relevance-badge" style={{ '--score-color': scoreColor }}>
            <span className="relevance-score">{matchPercentage}%</span>
            <span className="relevance-label">Match</span>
          </div>

          {/* Title and Base Meta (Visible even when not expanded if we want, or just title) */}
          <div className="card-info-base">
            <h3 className="card-title">{movie.title}</h3>
            {/* When not expanded, show year and genres */}
            {!isExpanded && (
              <div className="card-meta">
                <span className="card-year">{releaseYear}</span>
                <span className="card-dot">•</span>
                <span className="card-rating">⭐ {rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Panel - Hidden by default, visible when expanded */}
        {isExpanded && (
          <div className="card-dropdown-panel">
            
            {/* Actions Row */}
            <div className="card-actions-row">
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} ${releaseYear} trailer`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary action-btn"
                onClick={e => e.stopPropagation()}
              >
                Trailer 🎥
              </a>
              <button
                className="btn btn-secondary action-btn shrink-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(false)
                }}
              >
                Close ❌
              </button>
            </div>

            {/* Detailed Meta Row (Match, Year, Runtime) */}
            <div className="card-detailed-meta">
              <span className="meta-match" style={{ color: scoreColor }}>{matchPercentage}% Match</span>
              <span className="meta-year">{releaseYear}</span>
              {details?.runtime ? (
                <span className="meta-runtime">{details.runtime}m</span>
              ) : loadingDetails ? (
                <span className="meta-runtime">...</span>
              ) : null}
            </div>

            {/* Genres */}
            <div className="card-genres">
              {(movie.genre_ids || []).slice(0, 3).map(id => (
                <span key={id} className="genre-pill">
                  {GENRE_NAMES[id] || 'Movie'}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="card-synopsis">{shortOverview}</p>

            {/* OTT Providers */}
            <div className="card-providers-mini">
              {loadingDetails ? (
                <span className="provider-msg">Checking availability...</span>
              ) : details?.watchProviders ? (
                <div className="providers-list-mini">
                  <span className="provider-msg">Watch on:</span>
                  {Array.from(new Map([
                      ...(details.watchProviders.flatrate || []),
                      ...(details.watchProviders.rent || []),
                      ...(details.watchProviders.buy || [])
                    ].map(p => [p.provider_id, p])).values()
                  ).slice(0, 4).map(provider => (
                    <img
                      key={provider.provider_id}
                      src={`${IMAGE_BASE}${provider.logo_path}`}
                      alt={provider.provider_name}
                      title={provider.provider_name}
                      className="provider-logo-mini"
                    />
                  ))}
                </div>
              ) : (
                <span className="provider-msg">No streaming data</span>
              )}
            </div>

          </div>
        )}
      </div>
    </motion.div>
  )
}
