import { NavLink, useNavigate } from 'react-router-dom';
import { setAccessToken } from '../../lib/api';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: '⌂' },
      { label: 'Architecture', path: '/architecture', icon: '⚡' },
    ],
  },
  {
    title: 'Evidence Engine',
    items: [
      { label: 'Resume Studio', path: '/resume', icon: '📄', badge: 'AI' },
      { label: 'Skill Evidence', path: '/skills', icon: '🎯' },
      { label: 'Career Paths', path: '/careers', icon: '🗺️' },
      { label: 'Job Matches', path: '/jobs', icon: '💼', badge: '12' },
    ],
  },
  {
    title: 'Interview & Coaching',
    items: [
      { label: 'Mock Interviews', path: '/interviews', icon: '🎤' },
      { label: 'Learning Roadmap', path: '/roadmap', icon: '🛣️' },
      { label: 'AI Career Coach', path: '/chat', icon: '✦', badge: 'New' },
      { label: 'Analytics', path: '/analytics', icon: '📊' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();

  function handleSignOut() {
    setAccessToken(null);
    navigate('/login');
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand-wrapper">
          <NavLink className="sidebar-brand" to="/dashboard" onClick={onClose} title="Pathway Home">
            <div className="brand-logo-icon">
              <span>✦</span>
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-name font-black tracking-tight text-slate-900">Pathway</span>
              <span className="brand-workspace-tag text-indigo-600 font-bold">AI Workspace 2.0</span>
            </div>
          </NavLink>

          {onClose && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-scrollable-nav">
          {navSections.map((section) => (
            <div key={section.title} className="sidebar-nav-group">
              <p className="sidebar-group-title">{section.title}</p>
              <nav className="sidebar-links-list">
                {section.items.map(({ label, path, icon, badge }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={onClose}
                    className={({ isActive }: { isActive: boolean }) =>
                      `sidebar-nav-item transition-all duration-200 hover:translate-x-1 ${isActive ? 'is-active' : ''}`
                    }
                    title={label}
                  >
                    <span className="nav-item-icon" aria-hidden="true">
                      {icon}
                    </span>
                    <span className="nav-item-label">{label}</span>
                    {badge && <span className="nav-item-badge">{badge}</span>}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom User & Signout Profile Card */}
        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }: { isActive: boolean }) =>
              `sidebar-nav-item sidebar-profile-item ${isActive ? 'is-active' : ''}`
            }
            title="Account Profile"
          >
            <div className="avatar-chip small">
              <span>KS</span>
            </div>
            <div className="sidebar-profile-info">
              <span className="user-name">Kunal Sharma</span>
              <span className="user-role">SDE-1 Track</span>
            </div>
          </NavLink>

          <button className="sidebar-signout-btn" onClick={handleSignOut} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
