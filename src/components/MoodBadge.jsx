import { motion } from 'framer-motion'
import { EMOTION_EMOJI, EMOTION_COLOR, getEmotionLabel } from '../services/emotionMapper'
import './MoodBadge.css'

function MoodBadge({ mood, size = 'md', showLabel = true }) {
  if (!mood) return null
  const emoji = EMOTION_EMOJI[mood] || '😐'
  const color = EMOTION_COLOR[mood] || '#94a3b8'
  const label = getEmotionLabel(mood)

  return (
    <motion.div
      className={`mood-badge mood-badge--${size}`}
      style={{ '--mood-color': color }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className="mood-badge__emoji">{emoji}</span>
      {showLabel && <span className="mood-badge__label">{label}</span>}
    </motion.div>
  )
}

export default MoodBadge
