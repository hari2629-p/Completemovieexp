import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import SurveyPage from './pages/SurveyPage'
import RecommendationsPage from './pages/RecommendationsPage'
import LoadingSpinner from './components/LoadingSpinner'

const DetectorPage = lazy(() => import('./pages/DetectorPage'))
import useLocalStorage from './hooks/useLocalStorage'

function App() {
  const [preferences, setPreferences] = useLocalStorage('moodapp_prefs', null)
  const [detectedMood, setDetectedMood] = useState(null)

  return (
    <BrowserRouter>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar preferences={preferences} />
        
        <main style={{ flex: 1 }}>
          <Suspense fallback={<LoadingSpinner message="Loading cinematic experience..." />}>
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
          </Suspense>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
