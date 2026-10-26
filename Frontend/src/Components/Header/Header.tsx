import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Role Simulator', href: '#simulator' },
    { label: 'Evidence Engine', href: '#features' },
    { label: 'Readiness Calculator', href: '#calculator' },
    { label: 'Why Pathway', href: '#comparison' },
    { label: 'Placements', href: '#stories' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="site-header sticky top-0 z-50 backdrop-blur-md bg-white/80 transition-all duration-300">
      <div className="header-container">
        {/* Brand Logo */}
        <Link to="/" className="header-brand group transition-transform duration-300 hover:scale-105" aria-label="Pathway Home">
          <div className="brand-logo-icon group-hover:rotate-12 transition-transform duration-300 shadow-md shadow-indigo-500/25">
            <span>✦</span>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="brand-name font-black tracking-tight text-slate-900">Pathway</span>
              <span className="brand-badge bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px] shadow-sm">
                AI 2.0
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 -mt-0.5 tracking-wider uppercase">By Kunal Sharma</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="header-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="nav-link transition-colors duration-200 hover:text-indigo-600">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="header-actions">
          <Link to="/login" className="btn-header-ghost transition-all duration-200 hover:bg-slate-100">
            Sign In
          </Link>
          <Link to="/dashboard" className="btn-header-primary transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95">
            Launch Workspace
            <svg
              className="action-arrow transition-transform duration-200 group-hover:translate-x-1"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-toggle"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <nav className="mobile-nav" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mobile-menu-divider" />
            <div className="mobile-menu-actions">
              <Link
                to="/login"
                className="mobile-btn-ghost"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/dashboard"
                className="btn-header-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Launch Workspace Free ↗
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
