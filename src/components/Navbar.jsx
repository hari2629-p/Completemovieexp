import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Navbar.css'

function Navbar({ preferences }) {
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/detect', label: 'Detect Mood' },
    ...(preferences ? [{ to: '/recommendations', label: 'Movies' }] : []),
  ]

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text gradient-text">MoodFlick</span>
        </Link>

        <div className="navbar-links">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {preferences ? (
            <Link to="/detect" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
              ✨ Detect Mood
            </Link>
          ) : (
            <Link to="/survey" className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '14px' }}>
              Get Started
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
