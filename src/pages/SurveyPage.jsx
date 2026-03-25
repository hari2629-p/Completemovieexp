import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GENRES } from '../services/emotionMapper'
import './SurveyPage.css'

const EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral']
const EMOTION_LABELS = {
  happy: '😄 Happy', sad: '😢 Sad', angry: '😠 Angry', surprised: '😲 Surprised',
  fearful: '😨 Anxious', disgusted: '🤢 Disgusted', neutral: '😐 Neutral',
}
const ALL_GENRES = Object.keys(GENRES)
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Korean', 'French', 'Spanish', 'Japanese']

const DEFAULT_COPING = Object.fromEntries(EMOTIONS.map(e => [e, 'uplift']))

function SurveyPage({ onComplete }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [coping, setCoping] = useState(DEFAULT_COPING)
  const [genres, setGenres] = useState([])
  const [languages, setLanguages] = useState(['English'])

  const steps = [
    { title: 'Coping Style', subtitle: 'How do you like to react with movies for each emotion?' },
    { title: 'Favorite Genres', subtitle: 'Select all genres you enjoy watching.' },
    { title: 'Languages', subtitle: 'Which languages do you prefer for your movies?' },
  ]

  function toggleGenre(g) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function toggleLanguage(l) {
    setLanguages(prev =>
      prev.includes(l)
        ? (prev.length > 1 ? prev.filter(x => x !== l) : prev)
        : [...prev, l]
    )
  }

  function handleSubmit() {
    const prefs = { coping, genres: genres.length ? genres : ['Action', 'Comedy', 'Drama'], languages }
    onComplete(prefs)
    navigate('/detect')
  }

  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="survey-page page-wrapper">
      <div className="container">
        <motion.div
          className="survey-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Progress */}
          <div className="survey-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">Step {step + 1} of {steps.length}</span>
          </div>

          {/* Header */}
          <div className="survey-header">
            <h1 className="survey-title gradient-text">{steps[step].title}</h1>
            <p className="survey-subtitle">{steps[step].subtitle}</p>
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" className="step-content" {...slideProps}>
                <div className="coping-grid">
                  {EMOTIONS.map(emotion => (
                    <div key={emotion} className="coping-row">
                      <span className="coping-emotion">{EMOTION_LABELS[emotion]}</span>
                      <div className="coping-options">
                        {[
                          { val: 'uplift', label: '⬆️ Uplift me', desc: 'Feel better' },
                          { val: 'match',  label: '🪞 Match mood', desc: 'Stay immersed' },
                        ].map(opt => (
                          <button
                            key={opt.val}
                            className={`coping-btn ${coping[emotion] === opt.val ? 'active' : ''}`}
                            onClick={() => setCoping(prev => ({ ...prev, [emotion]: opt.val }))}
                          >
                            <span className="coping-btn-label">{opt.label}</span>
                            <span className="coping-btn-desc">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" className="step-content" {...slideProps}>
                <div className="chip-grid">
                  {ALL_GENRES.map(g => (
                    <button
                      key={g}
                      className={`chip ${genres.includes(g) ? 'active' : ''}`}
                      onClick={() => toggleGenre(g)}
                    >
                      {genres.includes(g) ? '✓ ' : ''}
                      {g}
                    </button>
                  ))}
                </div>
                {genres.length === 0 && (
                  <p className="hint-text">If you skip, a default mix of genres will be used.</p>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" className="step-content" {...slideProps}>
                <div className="chip-grid">
                  {LANGUAGES.map(l => (
                    <button
                      key={l}
                      className={`chip ${languages.includes(l) ? 'active' : ''}`}
                      onClick={() => toggleLanguage(l)}
                    >
                      {languages.includes(l) ? '✓ ' : ''}
                      {l}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="survey-nav">
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < steps.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit}>
                🎬 Find My Movies
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const slideProps = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -30 },
  transition: { duration: 0.3 },
}

export default SurveyPage
