import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './LandingPage.css'

const FEATURES = [
  { icon: '🎭', title: 'Emotion Detection', desc: 'Your camera reads your facial expression in real-time using AI.' },
  { icon: '🎯', title: 'Smart Matching', desc: 'Movies are matched to your mood and personal genre preferences.' },
  { icon: '📊', title: 'Relevance Score', desc: 'Each film gets an emotional compatibility score just for you.' },
  { icon: '🌍', title: 'Multi-Language', desc: 'Discover films across English, Hindi, Korean, French and more.' },
]

function LandingPage({ preferences }) {
  const navigate = useNavigate()

  function handleStart() {
    if (preferences) {
      navigate('/detect')
    } else {
      navigate('/survey')
    }
  }

  return (
    <div className="landing-page page-wrapper">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="hero-badge">
              <span>✨</span> AI-Powered Mood Detection
            </div>

            <h1 className="hero-title">
              MOODFLIX 🎬
            </h1>

            <p className="hero-subtitle">
              <strong className="gradient-text" style={{fontSize: '1.25rem', display: 'block', marginBottom: '10px'}}>
                Movies that understand your mood.
              </strong>
              Uses your camera to detect your emotion and recommends
              the perfect film to match or uplift your vibe — personalized just for you.
            </p>

            <div className="hero-actions">
              <motion.button
                className="btn btn-primary hero-cta"
                onClick={handleStart}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                {preferences ? '🎭 Start Experience' : '🚀 Start Experience'}
              </motion.button>
              {preferences && (
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate('/survey')}
                >
                  Update Preferences
                </button>
              )}
            </div>

            {preferences && (
              <motion.p
                className="hero-returning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                👋 Welcome back! Your preferences are saved.
              </motion.p>
            )}
          </motion.div>

          {/* Floating emoji orbs */}
          <div className="hero-orbs" aria-hidden="true">
            {['😄','😢','😠','😲','😨','😐'].map((emoji, i) => (
              <motion.div
                key={i}
                className="orb"
                style={{ '--delay': `${i * 0.5}s`, '--x': `${Math.random() * 80 + 10}%`, '--y': `${Math.random() * 60 + 20}%` }}
                animate={{ y: [0, -16, 0] }}
                transition={{ repeat: Infinity, duration: 3 + i * 0.4, delay: i * 0.5, ease: 'easeInOut' }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="feature-card glass-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="container">
          <motion.div
            className="banner-card glass-card"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2>Ready to find your perfect movie?</h2>
            <p>It only takes 30 seconds to set up your preferences and start detecting.</p>
            <button className="btn btn-primary" onClick={handleStart}>
              {preferences ? '🎭 Start Experience' : '🚀 Start Experience'}
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
