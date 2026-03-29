import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './SurveyPage.css'

const EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral']
const EMOTION_LABELS = {
  happy: '😄 Happy', sad: '😢 Sad', angry: '😠 Angry', surprised: '😲 Surprised',
  fearful: '😨 Anxious', disgusted: '🤢 Disgusted', neutral: '😐 Neutral',
}
const LANGUAGES = ['Malayalam', 'Tamil', 'Telugu', 'Hindi', 'Kannada', 'Marathi', 'Bengali', 'English', 'Korean', 'French', 'Spanish', 'Japanese']

const DEFAULT_COPING = Object.fromEntries(EMOTIONS.map(e => [e, 'uplift']))

function SurveyPage({ onComplete }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [coping, setCoping] = useState(DEFAULT_COPING)
  const [languages, setLanguages] = useState(['Malayalam', 'Tamil', 'Telugu', 'Hindi'])

  const steps = [
    { title: 'Coping Style', subtitle: 'How do you like to react with movies for each emotion?' },
    { title: 'Languages', subtitle: 'Which languages do you prefer for your movies?' },
  ]

  function toggleLanguage(l) {
    setLanguages(prev =>
      prev.includes(l)
        ? (prev.length > 1 ? prev.filter(x => x !== l) : prev)
        : [...prev, l]
    )
  }

  function handleSubmit() {
    const finalLangs = languages.length > 0 ? languages : ['Malayalam', 'Tamil', 'Telugu', 'Hindi']
    const prefs = { coping, languages: finalLangs }
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
