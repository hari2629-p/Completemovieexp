import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { IMAGE_BASE, getMovieDetailedInfo } from '../services/tmdbService'
import { GENRE_NAMES } from '../services/emotionMapper'
import './MovieCard.css'

export default function MovieCard({ movie, relevanceScore }) {
  const [imgError, setImgError] = useState(false)
  
  // Hover expansion state
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandDirection, setExpandDirection] = useState('right')
  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const hoverTimeout = useRef(null)
  const cardRef = useRef(null)

  const handleMouseEnter = () => {
    // Desktop only
    if (window.innerWidth > 768) {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const isRightSide = (rect.left + rect.width / 2) > window.innerWidth / 2
        setExpandDirection(isRightSide ? 'left' : 'right')
      }

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
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const isRightSide = (rect.left + rect.width / 2) > window.innerWidth / 2
        setExpandDirection(isRightSide ? 'left' : 'right')
      }
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
    ? (movie.overview.length > 200 ? movie.overview.slice(0, 200) + '...' : movie.overview)
    : 'No synopsis available.'

  return (
    <motion.div 
      className={`movie-card-wrapper ${isExpanded ? `is-expanded-wrapper expand-${expandDirection}` : ''}`}
      style={{ zIndex: isExpanded ? 50 : 1 }}
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={toggleExpand}
    >
      {/* 
        This is the untouchable poster container.
        We no longer scale or widen it heavily to avoid layout bugs. 
      */}
      <div className={`movie-card-content ${isExpanded ? 'expanded' : ''}`}>
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

          {/* Gradient Overlay for Text Readability - Only show when NOT expanded or on mobile */}
          {!isExpanded && <div className="poster-overlay"></div>}

          {/* Top Right Match Badge - Hidden when expanded to clean up UI */}
          {!isExpanded && (
            <div className="relevance-badge" style={{ '--score-color': scoreColor }}>
              <span className="relevance-score">{matchPercentage}%</span>
              <span className="relevance-label">Match</span>
            </div>
          )}

          {/* Title and Base Meta */}
          {!isExpanded && (
            <div className="card-info-base">
              <h3 className="card-title">{movie.title}</h3>
              <div className="card-meta">
                <span className="card-year">{releaseYear}</span>
                <span className="card-dot">•</span>
                <span className="card-rating">⭐ {rating}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 
        Side Panel - Rendered completely outside `.movie-card-content` 
        so it isn't clipped by overflow restrictions!
      */}
      {isExpanded && (
        <div className={`card-side-panel expand-${expandDirection}`}>
          
          <div className="panel-header">
            <h2 className="panel-title">{movie.title}</h2>
            <button 
              className="panel-close-btn"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(false)
              }}
            >
              ✕
            </button>
          </div>

          <div className="panel-meta-row">
            {details?.original_language && <span className="meta-lang">{details.original_language.toUpperCase()}</span>}
            <span className="meta-year">{releaseYear}</span>
            <span className="meta-dot">•</span>
            <span className="meta-genres">
              {(movie.genre_ids || []).slice(0, 2).map((id, idx, arr) => (
                <span key={id}>{GENRE_NAMES[id] || 'Movie'}{idx < arr.length - 1 ? ' • ' : ''}</span>
              ))}
            </span>
          </div>
          
          <div className="panel-meta-row secondary">
            {details?.runtime ? (
              <span className="meta-runtime">{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
            ) : loadingDetails ? (
              <span className="meta-runtime">...</span>
            ) : null}
            <span className="meta-match" style={{ color: scoreColor }}>{matchPercentage}% Match</span>
          </div>

          <p className="panel-synopsis">{shortOverview}</p>

          <div className="panel-actions">
            {/* The user requested the Watch button to actually link to the movie providers */}
            <a
              href={details?.tmdbLink || `https://www.themoviedb.org/movie/${movie.id}/watch`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary watch-btn"
              onClick={e => e.stopPropagation()}
            >
              watch now ▶
            </a>
          </div>

          {/* OTT Providers */}
          <div className="panel-providers">
            {loadingDetails ? (
              <span className="provider-msg">Checking streaming availability...</span>
            ) : details?.watchProviders ? (
              <div className="providers-list-mini">
                {Array.from(new Map([
                    ...(details.watchProviders.flatrate || []),
                    ...(details.watchProviders.rent || []),
                    ...(details.watchProviders.buy || [])
                  ].map(p => [p.provider_id, p])).values()
                ).slice(0, 4).map(provider => (
                  <a
                    key={provider.provider_id}
                    href={details?.tmdbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    <img
                      src={`${IMAGE_BASE}${provider.logo_path}`}
                      alt={provider.provider_name}
                      title={provider.provider_name}
                      className="provider-logo-mini"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <span className="provider-msg text-subtle">Not streaming locally</span>
            )}
          </div>

        </div>
      )}
    </motion.div>
  )
}
