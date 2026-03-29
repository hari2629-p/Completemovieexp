import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as faceapi from '@vladmandic/face-api'
import MoodBadge from '../components/MoodBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import './DetectorPage.css'

const EMOTION_EMOJIS = {
  happy: '😄', sad: '😢', angry: '😠',
  surprised: '😲', fearful: '😨', disgusted: '🤢', neutral: '😐',
}

const EMOTION_LABELS = {
  happy: 'Happy', sad: 'Sad', angry: 'Angry',
  surprised: 'Surprised', fearful: 'Anxious',
  disgusted: 'Disgusted', neutral: 'Neutral',
}

const MANUAL_MOODS = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral']

const DETECTION_INTERVAL_MS = 400
const MODEL_URL = '/models'

function DetectorPage({ onMoodDetected }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  
  // Smoothing and Auto-Confirm Refs
  const emotionHistoryRef = useRef([]) 
  const consecutiveMoodRef = useRef({ mood: null, count: 0 })

  const [phase, setPhase] = useState('loading') // loading | camera | manual | confirmed
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [liveEmotion, setLiveEmotion] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [confirmed, setConfirmed] = useState(null)
  const [cameraName, setCameraName] = useState('')

  // Load face-api models
  useEffect(() => {
    let cancelled = false
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])
        if (!cancelled) setModelsLoaded(true)
      } catch (err) {
        console.warn('Could not load face-api models:', err)
        if (!cancelled) {
          setCameraError('Models not found. Use manual mood selection below.')
          setPhase('manual')
        }
      }
    }
    loadModels()
    return () => { cancelled = true }
  }, [])

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  // Start camera once models loaded
  useEffect(() => {
    if (!modelsLoaded) return
    let cancelled = false
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const track = stream.getVideoTracks()[0]
        if (track) setCameraName(track.label)

        setPhase('camera')
      } catch (err) {
        if (!cancelled) {
          setCameraError('Camera access denied or unavailable.')
          setPhase('manual')
        }
      }
    }
    startCamera()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [modelsLoaded, stopCamera])

  // Connect stream to video element when it mounts
  useEffect(() => {
    if (phase === 'camera' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.warn('Video play error:', e))
        }
      }
    }
  }, [phase])

  const confirmMood = useCallback((mood) => {
    stopCamera()
    setConfirmed(mood)
    setPhase('confirmed')
    if (onMoodDetected) onMoodDetected(mood)
  }, [stopCamera, onMoodDetected])

  // Detection loop
  const detect = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.paused || video.ended || !modelsLoaded) return

    const result = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions()

    const ctx = canvas.getContext('2d')
    if (!result) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      consecutiveMoodRef.current = { mood: null, count: 0 }
      return
    }

    // Draw detection box
    const dims = faceapi.matchDimensions(canvas, video, true)
    const resized = faceapi.resizeResults(result, dims)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw box
    const { x, y, width, height } = resized.detection.box
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.9)'
    ctx.lineWidth = 2
    ctx.shadowColor = 'rgba(139, 92, 246, 0.6)'
    ctx.shadowBlur = 8
    ctx.strokeRect(x, y, width, height)

    // Get top emotion
    const expressions = result.expressions
    const top = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0]
    const detectedEmotion = top[0]
    const detectedConf = Math.round(top[1] * 100)

    // Thresholding: Ignore low confidence expressions
    if (detectedConf < 50) {
      consecutiveMoodRef.current = { mood: null, count: 0 }
      return
    }

    // Emotion Smoothing
    const history = emotionHistoryRef.current
    history.push(detectedEmotion)
    if (history.length > 5) history.shift()

    // Find dominant emotion in recent history
    const counts = {}
    let dominantEmotion = detectedEmotion
    let maxCount = 0
    history.forEach(e => {
      counts[e] = (counts[e] || 0) + 1
      if (counts[e] > maxCount) {
        maxCount = counts[e]
        dominantEmotion = e
      }
    })

    setLiveEmotion(dominantEmotion)
    setConfidence(detectedConf)

    // Touchless Auto-Confirmation
    if (detectedConf > 75) {
      if (consecutiveMoodRef.current.mood === dominantEmotion) {
        consecutiveMoodRef.current.count += 1
        // Auto-confirm if held for ~2 seconds (5 ticks @ 400ms)
        if (consecutiveMoodRef.current.count >= 5) {
          confirmMood(dominantEmotion)
        }
      } else {
        consecutiveMoodRef.current = { mood: dominantEmotion, count: 1 }
      }
    } else {
      consecutiveMoodRef.current = { mood: null, count: 0 }
    }
  }, [modelsLoaded, confirmMood])

  useEffect(() => {
    if (phase !== 'camera') return
    intervalRef.current = setInterval(detect, DETECTION_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [phase, detect])

  function goToRecs() {
    navigate('/recommendations')
  }

  function switchToManual() {
    stopCamera()
    setPhase('manual')
  }

  return (
    <div className="detector-page page-wrapper">
      <div className="container">
        <motion.div
          className="detector-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="detector-header">
            <h1 className="detector-title">
              {phase === 'confirmed' ? '🎉 Mood Confirmed!' : '🎭 Detect Your Mood'}
            </h1>
            <p className="detector-subtitle">
              {phase === 'loading' && 'Loading AI models…'}
              {phase === 'camera' && 'Look at the camera — we\'ll read your expression.'}
              {phase === 'manual' && 'Pick your current mood below.'}
              {phase === 'confirmed' && `You're feeling ${EMOTION_LABELS[confirmed] || confirmed}. Time for movies!`}
            </p>
          </div>

          {/* Loading */}
          {phase === 'loading' && (
            <motion.div 
              className="detector-loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <LoadingSpinner message="Initializing AI Models..." />
              <p className="loading-subtext">Preparing neural networks for emotion analysis...</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '12px' }}>
                This one-time setup ensures all processing happens privately in your browser.
              </p>
            </motion.div>
          )}

          {/* Camera View */}
          {phase === 'camera' && (
            <AnimatePresence>
              <motion.div
                className="camera-wrapper"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="video-container">
                  <video
                    ref={videoRef}
                    className="camera-video"
                    autoPlay
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="detection-canvas" />

                  {/* Live emotion overlay */}
                  {liveEmotion && (
                    <div className="live-emotion-overlay">
                      <span className="live-emoji">{EMOTION_EMOJIS[liveEmotion]}</span>
                      <div className="live-info">
                        <span className="live-label">{EMOTION_LABELS[liveEmotion]}</span>
                        <div className="confidence-bar">
                          <div
                            className="confidence-fill"
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        <span className="confidence-pct">{confidence}% confident</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="camera-actions">
                  {cameraName && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px', lineHeight: '1.4' }}>
                      📷 Captured Video Device: <br/><strong style={{color: 'var(--text-primary)'}}>{cameraName}</strong>
                      <br/>(If the screen is black, please check your camera's privacy shield or virtual camera settings)
                    </div>
                  )}
                  <motion.button
                    className="btn btn-primary confirm-btn"
                    disabled={!liveEmotion}
                    onClick={() => confirmMood(liveEmotion)}
                    whileHover={liveEmotion ? { scale: 1.04 } : {}}
                    whileTap={liveEmotion ? { scale: 0.97 } : {}}
                  >
                    ✅ Confirm Mood{liveEmotion ? ` — ${EMOTION_LABELS[liveEmotion]}` : ''}
                  </motion.button>
                  <button className="btn btn-ghost" onClick={switchToManual}>
                    Use keyboard instead
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Manual Picker */}
          {phase === 'manual' && (
            <motion.div
              className="manual-picker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {cameraError && (
                <div className="camera-error-banner">
                  ⚠️ {cameraError}
                </div>
              )}
              <p className="manual-instruction">How are you feeling right now?</p>
              <div className="mood-grid">
                {MANUAL_MOODS.map((mood, i) => (
                  <motion.button
                    key={mood}
                    className="mood-btn"
                    onClick={() => confirmMood(mood)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.07, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="mood-emoji">{EMOTION_EMOJIS[mood]}</span>
                    <span className="mood-name">{EMOTION_LABELS[mood]}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirmed State */}
          {phase === 'confirmed' && confirmed && (
            <motion.div
              className="confirmed-state"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="confirmed-emoji">{EMOTION_EMOJIS[confirmed]}</div>
              <MoodBadge mood={confirmed} size="lg" />
              <div className="confirmed-actions">
                <motion.button
                  className="btn btn-primary"
                  onClick={goToRecs}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  🎬 Show My Movies →
                </motion.button>
                <button className="btn btn-ghost" onClick={() => setPhase('manual')}>
                  Change Mood
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default DetectorPage
