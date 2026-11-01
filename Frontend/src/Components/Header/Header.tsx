import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import { BrandLogo } from '../BrandLogo';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Role Simulator', href: '#simulator' },
    { label: 'Readiness Calculator', href: '#calculator' },
    { label: 'Why HiPlacement', href: '#comparison' },
    { label: 'Placement Proof', href: '#stories' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] backdrop-blur-md transition-colors flex justify-center">
      <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="HiPlacement Home">
          <BrandLogo size={32} showText={true} badge="AI 2.0" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions (Theme Toggle + Auth) */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link to="/login" className="btn-ghost text-xs hidden sm:inline-flex">
            Sign In
          </Link>

          <Link to="/dashboard" className="btn-primary text-xs py-2 px-3.5">
            <span>Launch Workspace</span>
            <span aria-hidden="true">↗</span>
          </Link>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <Link
              to="/login"
              className="text-xs font-bold text-[var(--text-primary)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In to Account
            </Link>
            <Link
              to="/dashboard"
              className="btn-primary text-xs"
              onClick={() => setMobileMenuOpen(false)}
            >
              Launch Workspace Free ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
