import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import SurveyPage from './pages/SurveyPage'
import DetectorPage from './pages/DetectorPage'
import RecommendationsPage from './pages/RecommendationsPage'
import useLocalStorage from './hooks/useLocalStorage'

function App() {
  const [preferences, setPreferences] = useLocalStorage('moodapp_prefs', null)
  const [detectedMood, setDetectedMood] = useState(null)

  return (
    <BrowserRouter>
      <Navbar preferences={preferences} />
      <Routes>
        <Route path="/" element={<LandingPage preferences={preferences} />} />
        <Route
          path="/survey"
          element={<SurveyPage onComplete={(prefs) => setPreferences(prefs)} />}
        />
        <Route
          path="/detect"
          element={
            <DetectorPage
              onMoodDetected={(mood) => setDetectedMood(mood)}
            />
          }
        />
        <Route
          path="/recommendations"
          element={
            preferences
              ? <RecommendationsPage preferences={preferences} detectedMood={detectedMood} />
              : <Navigate to="/survey" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
