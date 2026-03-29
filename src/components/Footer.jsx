import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🎬</span>
              <span className="logo-text gradient-text">MOODFLIX</span>
            </div>
            <p className="footer-tagline">
              AI-powered movie recommendations based on your real-time emotions.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-group">
              <h4 className="footer-heading">Features</h4>
              <a href="/#how-it-works" className="footer-link">How it Works</a>
              <a href="/detect" className="footer-link">Emotion Scanner</a>
              <a href="/survey" className="footer-link">Manual Setup</a>
            </div>
            <div className="footer-group">
              <h4 className="footer-heading">Legal</h4>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link" onClick={e => e.preventDefault()}>Terms of Service</a>
            </div>
            <div className="footer-group">
              <h4 className="footer-heading">Powered By</h4>
              <div className="footer-attribution">
                <img 
                  src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg" 
                  alt="TMDB Logo" 
                  className="tmdb-logo"
                />
                <p className="attribution-text">
                  Data provided by the TMDB API. Not endorsed or certified.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} MOODFLIX. All rights reserved. Built for the future of cinema.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
