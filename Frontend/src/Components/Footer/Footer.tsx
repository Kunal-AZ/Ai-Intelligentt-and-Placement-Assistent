import { Link } from 'react-router-dom';
import { BrandLogo } from '../BrandLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-16 text-[var(--text-secondary)] flex justify-center">
      <div className="w-full max-w-7xl mx-auto px-6 flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <Link to="/" className="flex items-center gap-2" aria-label="HiPlacement Home">
              <BrandLogo size={28} showText={true} />
            </Link>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              AI Career &amp; Placement Platform for ambitious engineering students cracking top tech offers.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
              <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Links 1 */}
          <div className="flex flex-col gap-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Platform
            </h4>
            <Link to="/resume" className="hover:text-[var(--text-primary)] transition-colors">
              Resume Studio (ATS 2.0)
            </Link>
            <Link to="/skills" className="hover:text-[var(--text-primary)] transition-colors">
              Skill Evidence &amp; Gaps
            </Link>
            <Link to="/jobs" className="hover:text-[var(--text-primary)] transition-colors">
              Verified Job Matches
            </Link>
            <Link to="/interviews" className="hover:text-[var(--text-primary)] transition-colors">
              AI Mock Interviews
            </Link>
          </div>

          {/* Links 2 */}
          <div className="flex flex-col gap-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Intelligence
            </h4>
            <Link to="/roadmap" className="hover:text-[var(--text-primary)] transition-colors">
              30-Day Sprint Roadmap
            </Link>
            <Link to="/chat" className="hover:text-[var(--text-primary)] transition-colors">
              AI Career Coach
            </Link>
            <Link to="/architecture" className="hover:text-[var(--text-primary)] transition-colors">
              Architecture &amp; Microservices
            </Link>
            <Link to="/profile" className="hover:text-[var(--text-primary)] transition-colors">
              Student Profile Settings
            </Link>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Off-Campus Intelligence
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Get verified hiring rubrics, Tier-1 interview questions, and placement drive alerts.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); alert('Subscribed to placement intelligence.'); }}
              className="flex gap-2 mt-1"
            >
              <input
                type="email"
                placeholder="college@email.edu"
                className="form-input text-xs py-2"
                required
              />
              <button type="submit" className="btn-primary text-xs py-2 px-3">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {currentYear} HiPlacement. Created by Kunal Sharma. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built with Swiss Precision</span>
            <span>Zero Tracking Blackboxes</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
