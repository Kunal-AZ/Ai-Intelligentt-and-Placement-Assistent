import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Top Section */}
        <div className="footer-top-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo">
              <div className="brand-logo-icon">
                <span>✦</span>
              </div>
              <span className="brand-name">pathway</span>
            </Link>
            <p className="footer-tagline">
              The AI Career Companion &amp; Evidence Engine designed for engineering students
              and ambitious developers cracking top tech placements.
            </p>
            <div className="footer-status-badge">
              <span className="status-indicator-dot animate-pulse" />
              <span>All Systems Operational · AI v2.4</span>
            </div>
          </div>

          {/* Nav Columns */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/resume" className="transition-colors duration-200 hover:text-indigo-400">Resume Studio</Link></li>
              <li><Link to="/skills" className="transition-colors duration-200 hover:text-indigo-400">Skill Gap Radar</Link></li>
              <li><Link to="/careers" className="transition-colors duration-200 hover:text-indigo-400">Career Paths</Link></li>
              <li><Link to="/jobs" className="transition-colors duration-200 hover:text-indigo-400">Target Job Matches</Link></li>
              <li><Link to="/interviews" className="transition-colors duration-200 hover:text-indigo-400">AI Mock Interviews</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading">Tools &amp; AI</h4>
            <ul className="footer-links">
              <li><a href="#simulator" className="transition-colors duration-200 hover:text-indigo-400">Live Role Simulator</a></li>
              <li><a href="#calculator" className="transition-colors duration-200 hover:text-indigo-400">Readiness Calculator</a></li>
              <li><Link to="/roadmap" className="transition-colors duration-200 hover:text-indigo-400">30-Day Roadmaps</Link></li>
              <li><Link to="/chat" className="transition-colors duration-200 hover:text-indigo-400">AI Career Coach</Link></li>
              <li><Link to="/architecture" className="transition-colors duration-200 hover:text-indigo-400">Tech Architecture</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="footer-newsletter-col">
            <h4 className="footer-heading">Stay in the Loop</h4>
            <p className="footer-newsletter-desc">
              Get weekly hiring trends, off-campus alerts, and placement interview breakdowns.
            </p>
            <form className="footer-newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed! Welcome aboard.'); }}>
              <input
                type="email"
                placeholder="Enter your college email"
                className="newsletter-input focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
                required
              />
              <button type="submit" className="newsletter-btn transition-transform duration-200 hover:scale-105 active:scale-95">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {currentYear} Pathway Technologies, Inc. Built for ambitious engineers worldwide.
          </p>

          <div className="footer-socials">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="X / Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
